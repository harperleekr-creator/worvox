import { Hono } from 'hono';
import type { Bindings } from '../types';

const rewards = new Hono<{ Bindings: Bindings }>();

// XP calculation functions (same as gamification.ts)
const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

const calculateLevel = (totalXP: number): number => {
  let level = 1;
  let xpNeeded = 0;
  
  while (totalXP >= xpNeeded + getXPForLevel(level)) {
    xpNeeded += getXPForLevel(level);
    level++;
  }
  
  return level;
};

// 🎁 Get available prizes for user's level
rewards.get('/prizes', async (c) => {
  try {
    const userLevel = parseInt(c.req.query('level') || '1');

    const prizes = await c.env.DB.prepare(`
      SELECT id, name, name_ko, description, image_url, category, stock, required_level, probability
      FROM reward_prizes
      WHERE is_active = 1 AND required_level <= ? AND stock > 0
      ORDER BY required_level ASC, probability DESC
    `).bind(userLevel).all();

    return c.json({
      success: true,
      prizes: prizes.results || []
    });

  } catch (error) {
    console.error('❌ Get prizes error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch prizes'
    }, 500);
  }
});

// 🎲 Spin the wheel / Draw a prize
rewards.post('/spin', async (c) => {
  try {
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ success: false, error: 'User ID required' }, 400);
    }

    // Get user info
    const user = await c.env.DB.prepare(
      'SELECT user_level, spin_count FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Check if user has spins available (1 spin per level up)
    if (user.spin_count <= 0) {
      return c.json({
        success: false,
        error: 'No spins available',
        message: '레벨업 시 뽑기 기회가 제공됩니다!'
      }, 400);
    }

    // Get available prizes for user's level
    const prizes = await c.env.DB.prepare(`
      SELECT id, name, name_ko, description, image_url, category, probability, required_level, stock
      FROM reward_prizes
      WHERE is_active = 1 AND required_level <= ? AND (stock > 0 OR stock = -1)
    `).bind(user.user_level).all();

    if (!prizes.results || prizes.results.length === 0) {
      return c.json({
        success: false,
        error: 'No prizes available',
        message: '현재 사용 가능한 상품이 없습니다.'
      }, 400);
    }

    // Weighted random selection based on probability
    const totalProbability = prizes.results.reduce((sum: number, p: any) => sum + p.probability, 0);
    let random = Math.random() * totalProbability;
    
    let selectedPrize: any = null;
    for (const prize of prizes.results) {
      random -= prize.probability;
      if (random <= 0) {
        selectedPrize = prize;
        break;
      }
    }

    if (!selectedPrize) {
      selectedPrize = prizes.results[0]; // Fallback to first prize
    }

    // Decrease spin count
    await c.env.DB.prepare(
      'UPDATE users SET spin_count = spin_count - 1 WHERE id = ?'
    ).bind(userId).run();

    // Check if it's an XP prize
    const isXPPrize = selectedPrize.category === 'xp';

    if (isXPPrize) {
      // For XP prizes: award XP directly and check level up
      const xpAmount = parseInt(selectedPrize.name.match(/\d+/)?.[0] || '0');
      
      if (xpAmount > 0) {
        // Get current user stats
        const currentUser = await c.env.DB.prepare(`
          SELECT user_level, xp, total_xp, coins FROM users WHERE id = ?
        `).bind(userId).first() as any;

        if (!currentUser) {
          throw new Error('User not found');
        }

        // Calculate new XP and level
        const newTotalXP = (currentUser.total_xp || 0) + xpAmount;
        const newLevel = calculateLevel(newTotalXP);
        const oldLevel = currentUser.user_level || 1;
        const leveledUp = newLevel > oldLevel;

        // Calculate current level progress
        let xpForCurrentLevel = 0;
        for (let i = 1; i < newLevel; i++) {
          xpForCurrentLevel += getXPForLevel(i);
        }
        const currentLevelXP = newTotalXP - xpForCurrentLevel;

        // Calculate coin rewards (1 coin per 10 XP)
        const coinsEarned = Math.floor(xpAmount / 10);
        const newCoins = (currentUser.coins || 0) + coinsEarned;

        // Calculate spin count increase if leveled up
        let spinCountIncrease = 0;
        if (leveledUp) {
          spinCountIncrease = newLevel - oldLevel; // 1 spin per level
        }

        // Update user stats with level up
        await c.env.DB.prepare(`
          UPDATE users 
          SET user_level = ?, 
              xp = ?, 
              total_xp = ?, 
              coins = ?,
              spin_count = spin_count + ?
          WHERE id = ?
        `).bind(newLevel, currentLevelXP, newTotalXP, newCoins, spinCountIncrease, userId).run();

        // Log activity
        await c.env.DB.prepare(`
          INSERT INTO user_activity_log (user_id, activity_type, xp_gained, coins_gained, details)
          VALUES (?, ?, ?, ?, ?)
        `).bind(userId, 'random_box', xpAmount, coinsEarned, `Random Box - ${selectedPrize.name_ko}`).run();

        // Award level-up badge if leveled up
        if (leveledUp) {
          await c.env.DB.prepare(`
            INSERT OR IGNORE INTO user_badges (user_id, badge_name, badge_description, badge_icon)
            VALUES (?, ?, ?, ?)
          `).bind(
            userId,
            `Level ${newLevel}`,
            `Reached level ${newLevel}!`,
            '🏆'
          ).run();

          console.log(`🎉 User ${userId} leveled up: ${oldLevel} → ${newLevel} (+${spinCountIncrease} spins)`);
        }

        console.log(`✅ User ${userId} won XP: ${xpAmount} (Level: ${oldLevel} → ${newLevel})`);
      }
    } else {
      // For physical/digital prizes: record the win
      await c.env.DB.prepare(`
        INSERT INTO user_prize_wins (user_id, prize_id, claim_status)
        VALUES (?, ?, 'pending')
      `).bind(userId, selectedPrize.id).run();

      // Decrease stock (only for non-XP prizes)
      await c.env.DB.prepare(
        'UPDATE reward_prizes SET stock = stock - 1 WHERE id = ? AND stock > 0'
      ).bind(selectedPrize.id).run();

      console.log(`✅ User ${userId} won prize: ${selectedPrize.name_ko}`);
    }

    return c.json({
      success: true,
      prize: selectedPrize,
      remainingSpins: (user.spin_count - 1),
      message: `🎉 축하합니다! ${selectedPrize.name_ko}에 당첨되셨습니다!`
    });

  } catch (error) {
    console.error('❌ Spin error:', error);
    return c.json({
      success: false,
      error: 'Failed to spin',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// 📋 Get user's prize history
rewards.get('/my-prizes', async (c) => {
  try {
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ success: false, error: 'User ID required' }, 400);
    }

    const wins = await c.env.DB.prepare(`
      SELECT 
        w.id,
        w.won_at,
        w.claim_status,
        w.claimed_at,
        w.tracking_number,
        p.name,
        p.name_ko,
        p.description,
        p.image_url,
        p.category
      FROM user_prize_wins w
      JOIN reward_prizes p ON w.prize_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.won_at DESC
    `).bind(userId).all();

    return c.json({
      success: true,
      prizes: wins.results || []
    });

  } catch (error) {
    console.error('❌ Get my prizes error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch prize history'
    }, 500);
  }
});

// 📝 Submit claim information
rewards.post('/claim', async (c) => {
  try {
    const { userId, prizeId, name, email, phone, address } = await c.req.json();

    if (!userId || !prizeId) {
      return c.json({ success: false, error: 'User ID and Prize ID required' }, 400);
    }

    // Get user info
    const user = await c.env.DB.prepare(`
      SELECT id, username, email FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Get prize info
    const prize = await c.env.DB.prepare(`
      SELECT id, name_ko, name_en, description, category FROM prizes WHERE id = ?
    `).bind(prizeId).first();

    if (!prize) {
      return c.json({ success: false, error: 'Prize not found' }, 404);
    }

    // Find the win record
    const win = await c.env.DB.prepare(`
      SELECT id FROM user_prize_wins
      WHERE user_id = ? AND prize_id = ? AND claim_status = 'pending'
      ORDER BY won_at DESC
      LIMIT 1
    `).bind(userId, prizeId).first();

    if (!win) {
      return c.json({ success: false, error: 'Win record not found' }, 404);
    }

    // Update claim information
    const contactInfo = JSON.stringify({ name, email, phone });
    
    await c.env.DB.prepare(`
      UPDATE user_prize_wins
      SET 
        claim_status = 'contacted',
        contact_info = ?,
        shipping_address = ?,
        claimed_at = datetime('now')
      WHERE id = ?
    `).bind(
      contactInfo,
      address || null,
      win.id
    ).run();

    console.log(`✅ Prize claim submitted for user ${userId}, prize ${prizeId}`);

    // Send notification email to support
    try {
      const RESEND_API_KEY = c.env.RESEND_API_KEY;
      
      if (!RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY not configured, skipping email notification');
      } else {
        const emailHTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>랜덤박스 당첨자 정보</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎁 랜덤박스 당첨자 정보
              </h1>
            </td>
          </tr>
          
          <!-- Winner Info -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: bold;">
                당첨 상품 정보
              </h2>
              <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px;">
                <tr style="background-color: #f9fafb;">
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; width: 30%;">상품명</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${prize.name_ko}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600;">상품 설명</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${prize.description}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="padding: 12px; color: #6b7280; font-weight: 600;">카테고리</td>
                  <td style="padding: 12px; color: #1f2937;">${prize.category === 'physical' ? '실물 상품' : prize.category === 'digital' ? '디지털 상품' : '서비스'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: bold;">
                당첨자 정보
              </h2>
              <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px;">
                <tr style="background-color: #f9fafb;">
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; width: 30%;">사용자 ID</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${user.id}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600;">사용자명</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${user.username || 'N/A'}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600;">이름</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600;">이메일</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${email}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="padding: 12px; ${address ? 'border-bottom: 1px solid #e5e7eb;' : ''} color: #6b7280; font-weight: 600;">전화번호</td>
                  <td style="padding: 12px; ${address ? 'border-bottom: 1px solid #e5e7eb;' : ''} color: #1f2937;">${phone}</td>
                </tr>
                ${address ? `
                <tr>
                  <td style="padding: 12px; color: #6b7280; font-weight: 600; vertical-align: top;">배송지 주소</td>
                  <td style="padding: 12px; color: #1f2937; white-space: pre-line;">${address}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                이 메일은 WorVox 랜덤박스 당첨자가 정보를 제출했을 때 자동으로 발송됩니다.
              </p>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} WorVox. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'WorVox <noreply@worvox.com>',
            to: ['support@worvox.com'],
            subject: `🎁 [랜덤박스 당첨] ${prize.name_ko} - ${name}`,
            html: emailHTML
          })
        });

        if (response.ok) {
          console.log('✅ Prize claim notification email sent to support@worvox.com');
        } else {
          const errorData = await response.json();
          console.error('❌ Failed to send notification email:', errorData);
        }
      }
    } catch (emailError) {
      console.error('❌ Email notification error (non-critical):', emailError);
      // Don't fail the claim submission if email fails
    }

    return c.json({
      success: true,
      message: '상품 수령 정보가 제출되었습니다. 곧 연락드리겠습니다!'
    });

  } catch (error) {
    console.error('❌ Claim error:', error);
    return c.json({
      success: false,
      error: 'Failed to submit claim',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default rewards;
