import { Hono } from 'hono';
import type { Bindings } from '../types';

const rewards = new Hono<{ Bindings: Bindings }>();

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
      SELECT id, name, name_ko, description, image_url, category, probability, required_level
      FROM reward_prizes
      WHERE is_active = 1 AND required_level <= ? AND stock > 0
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

    // Record the win
    await c.env.DB.prepare(`
      INSERT INTO user_prize_wins (user_id, prize_id, claim_status)
      VALUES (?, ?, 'pending')
    `).bind(userId, selectedPrize.id).run();

    // Decrease stock
    await c.env.DB.prepare(
      'UPDATE reward_prizes SET stock = stock - 1 WHERE id = ?'
    ).bind(selectedPrize.id).run();

    console.log(`✅ User ${userId} won prize: ${selectedPrize.name_ko}`);

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
    const { winId, contactInfo, shippingAddress } = await c.req.json();

    if (!winId) {
      return c.json({ success: false, error: 'Win ID required' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE user_prize_wins
      SET 
        claim_status = 'contacted',
        contact_info = ?,
        shipping_address = ?,
        claimed_at = datetime('now')
      WHERE id = ?
    `).bind(
      JSON.stringify(contactInfo),
      shippingAddress || null,
      winId
    ).run();

    console.log(`✅ Prize claim submitted for win ID: ${winId}`);

    return c.json({
      success: true,
      message: '상품 수령 정보가 제출되었습니다. 곧 연락드리겠습니다!'
    });

  } catch (error) {
    console.error('❌ Claim error:', error);
    return c.json({
      success: false,
      error: 'Failed to submit claim'
    }, 500);
  }
});

export default rewards;
