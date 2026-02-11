-- Add TOEIC related flag to vocabulary_words table
ALTER TABLE vocabulary_words ADD COLUMN toeic_related INTEGER DEFAULT 0;

-- Update existing words that are TOEIC related
UPDATE vocabulary_words SET toeic_related = 1 WHERE word IN (
  'technology', 'opportunity', 'experience', 'important', 'successful',
  'understand', 'create', 'improve', 'develop', 'achieve', 'manage',
  'organize', 'communicate', 'participate', 'consider', 'discover',
  'influence', 'accomplish', 'achievement', 'perspective',
  'infrastructure', 'implementation', 'methodology', 'comprehensive',
  'substantial', 'sophisticated', 'strategic', 'analytical',
  'demonstrate', 'facilitate', 'integrate', 'optimize'
);

-- Insert new TOEIC vocabulary words
INSERT INTO vocabulary_words (word, meaning_ko, pronunciation, part_of_speech, example_sentence, difficulty, category, toeic_related) VALUES
-- TOEIC Beginner
('schedule', '일정', '/ˈskedʒuːl/', 'noun', 'Check your schedule for the meeting.', 'beginner', 'nouns', 1),
('meeting', '회의', '/ˈmiːtɪŋ/', 'noun', 'The meeting starts at 3 PM.', 'beginner', 'nouns', 1),
('office', '사무실', '/ˈɔːfɪs/', 'noun', 'I work in an office.', 'beginner', 'nouns', 1),
('client', '고객', '/ˈklaɪənt/', 'noun', 'We need to call the client.', 'beginner', 'nouns', 1),
('company', '회사', '/ˈkʌmpəni/', 'noun', 'She works for a big company.', 'beginner', 'nouns', 1),
('project', '프로젝트', '/ˈprɑːdʒekt/', 'noun', 'Our project is almost done.', 'beginner', 'nouns', 1),
('report', '보고서', '/rɪˈpɔːrt/', 'noun', 'Please submit the report by Friday.', 'beginner', 'nouns', 1),
('deadline', '마감일', '/ˈdedlaɪn/', 'noun', 'The deadline is tomorrow.', 'beginner', 'nouns', 1),
('email', '이메일', '/ˈiːmeɪl/', 'noun', 'Send me an email later.', 'beginner', 'nouns', 1),
('document', '문서', '/ˈdɑːkjumənt/', 'noun', 'Please sign this document.', 'beginner', 'nouns', 1),

('available', '이용 가능한', '/əˈveɪləbəl/', 'adjective', 'Is this room available?', 'beginner', 'adjectives', 1),
('necessary', '필요한', '/ˈnesəseri/', 'adjective', 'It is necessary to attend.', 'beginner', 'adjectives', 1),
('possible', '가능한', '/ˈpɑːsəbəl/', 'adjective', 'Is it possible to change the time?', 'beginner', 'adjectives', 1),
('important', '중요한', '/ɪmˈpɔːrtənt/', 'adjective', 'This is very important.', 'beginner', 'adjectives', 1),
('busy', '바쁜', '/ˈbɪzi/', 'adjective', 'I am busy today.', 'beginner', 'adjectives', 1),

('attend', '참석하다', '/əˈtend/', 'verb', 'Please attend the meeting.', 'beginner', 'verbs', 1),
('complete', '완료하다', '/kəmˈpliːt/', 'verb', 'Complete the task by noon.', 'beginner', 'verbs', 1),
('submit', '제출하다', '/səbˈmɪt/', 'verb', 'Submit your report today.', 'beginner', 'verbs', 1),
('confirm', '확인하다', '/kənˈfɜːrm/', 'verb', 'Please confirm your attendance.', 'beginner', 'verbs', 1),
('contact', '연락하다', '/ˈkɑːntækt/', 'verb', 'Contact me if you have questions.', 'beginner', 'verbs', 1),

-- TOEIC Intermediate
('budget', '예산', '/ˈbʌdʒɪt/', 'noun', 'We need to discuss the budget.', 'intermediate', 'nouns', 1),
('invoice', '송장', '/ˈɪnvɔɪs/', 'noun', 'Send the invoice to accounting.', 'intermediate', 'nouns', 1),
('agreement', '합의', '/əˈɡriːmənt/', 'noun', 'We reached an agreement.', 'intermediate', 'nouns', 1),
('proposal', '제안서', '/prəˈpoʊzəl/', 'noun', 'Submit your proposal by Friday.', 'intermediate', 'nouns', 1),
('contract', '계약', '/ˈkɑːntrækt/', 'noun', 'Sign the contract here.', 'intermediate', 'nouns', 1),
('department', '부서', '/dɪˈpɑːrtmənt/', 'noun', 'Which department do you work in?', 'intermediate', 'nouns', 1),
('employee', '직원', '/ɪmˈplɔɪiː/', 'noun', 'We hired a new employee.', 'intermediate', 'nouns', 1),
('manager', '관리자', '/ˈmænɪdʒər/', 'noun', 'Talk to your manager about it.', 'intermediate', 'nouns', 1),
('colleague', '동료', '/ˈkɑːliːɡ/', 'noun', 'My colleague helped me.', 'intermediate', 'nouns', 1),
('supervisor', '감독자', '/ˈsuːpərvaɪzər/', 'noun', 'Ask your supervisor for approval.', 'intermediate', 'nouns', 1),

('urgent', '긴급한', '/ˈɜːrdʒənt/', 'adjective', 'This is an urgent matter.', 'intermediate', 'adjectives', 1),
('appropriate', '적절한', '/əˈproʊpriət/', 'adjective', 'Use appropriate language.', 'intermediate', 'adjectives', 1),
('significant', '중요한', '/sɪɡˈnɪfɪkənt/', 'adjective', 'This is a significant change.', 'intermediate', 'adjectives', 1),
('relevant', '관련된', '/ˈreləvənt/', 'adjective', 'Is this information relevant?', 'intermediate', 'adjectives', 1),
('sufficient', '충분한', '/səˈfɪʃənt/', 'adjective', 'We have sufficient time.', 'intermediate', 'adjectives', 1),

('conduct', '수행하다', '/kənˈdʌkt/', 'verb', 'We will conduct a survey.', 'intermediate', 'verbs', 1),
('implement', '실행하다', '/ˈɪmplɪment/', 'verb', 'Implement the new policy.', 'intermediate', 'verbs', 1),
('coordinate', '조정하다', '/koʊˈɔːrdɪneɪt/', 'verb', 'Coordinate with other teams.', 'intermediate', 'verbs', 1),
('evaluate', '평가하다', '/ɪˈvæljueɪt/', 'verb', 'Evaluate the results carefully.', 'intermediate', 'verbs', 1),
('negotiate', '협상하다', '/nɪˈɡoʊʃieɪt/', 'verb', 'Negotiate the terms of the contract.', 'intermediate', 'verbs', 1),

-- TOEIC Advanced
('expenditure', '지출', '/ɪkˈspendɪtʃər/', 'noun', 'Monitor your expenditure carefully.', 'advanced', 'nouns', 1),
('regulation', '규정', '/ˌreɡjuˈleɪʃən/', 'noun', 'Follow the company regulations.', 'advanced', 'nouns', 1),
('liability', '책임', '/ˌlaɪəˈbɪləti/', 'noun', 'The company has limited liability.', 'advanced', 'nouns', 1),
('credential', '자격증', '/krɪˈdenʃəl/', 'noun', 'Check your credentials.', 'advanced', 'nouns', 1),
('procurement', '조달', '/prəˈkjʊrmənt/', 'noun', 'The procurement process takes time.', 'advanced', 'nouns', 1),
('compliance', '준수', '/kəmˈplaɪəns/', 'noun', 'Ensure compliance with regulations.', 'advanced', 'nouns', 1),
('incentive', '인센티브', '/ɪnˈsentɪv/', 'noun', 'We offer performance incentives.', 'advanced', 'nouns', 1),
('merger', '합병', '/ˈmɜːrdʒər/', 'noun', 'The merger was successful.', 'advanced', 'nouns', 1),
('subsidiary', '자회사', '/səbˈsɪdieri/', 'noun', 'Our subsidiary is in Korea.', 'advanced', 'nouns', 1),
('stakeholder', '이해관계자', '/ˈsteɪkhoʊldər/', 'noun', 'Inform all stakeholders.', 'advanced', 'nouns', 1),

('mandatory', '의무적인', '/ˈmændətɔːri/', 'adjective', 'Attendance is mandatory.', 'advanced', 'adjectives', 1),
('consecutive', '연속적인', '/kənˈsekjətɪv/', 'adjective', 'For three consecutive days.', 'advanced', 'adjectives', 1),
('preliminary', '예비의', '/prɪˈlɪmɪneri/', 'adjective', 'This is a preliminary report.', 'advanced', 'adjectives', 1),
('adequate', '적절한', '/ˈædɪkwət/', 'adjective', 'We need adequate resources.', 'advanced', 'adjectives', 1),
('viable', '실행 가능한', '/ˈvaɪəbəl/', 'adjective', 'Is this plan viable?', 'advanced', 'adjectives', 1),

('authorize', '승인하다', '/ˈɔːθəraɪz/', 'verb', 'Authorize the payment.', 'advanced', 'verbs', 1),
('allocate', '할당하다', '/ˈæləkeɪt/', 'verb', 'Allocate resources efficiently.', 'advanced', 'verbs', 1),
('stipulate', '규정하다', '/ˈstɪpjuleɪt/', 'verb', 'The contract stipulates the terms.', 'advanced', 'verbs', 1),
('reimburse', '상환하다', '/ˌriːɪmˈbɜːrs/', 'verb', 'We will reimburse your expenses.', 'advanced', 'verbs', 1),
('consolidate', '통합하다', '/kənˈsɑːlɪdeɪt/', 'verb', 'Consolidate the reports.', 'advanced', 'verbs', 1);

-- Create index for TOEIC filtering
CREATE INDEX IF NOT EXISTS idx_vocabulary_toeic ON vocabulary_words(toeic_related);
