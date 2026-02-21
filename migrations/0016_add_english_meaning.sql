-- Add English meaning column to vocabulary_words
ALTER TABLE vocabulary_words ADD COLUMN meaning_en TEXT;

-- Update existing words with English meanings (sample data)
UPDATE vocabulary_words SET meaning_en = 'a greeting used when meeting someone' WHERE word = 'hello';
UPDATE vocabulary_words SET meaning_en = 'a parting phrase used when leaving' WHERE word = 'goodbye';
UPDATE vocabulary_words SET meaning_en = 'an expression of gratitude' WHERE word = 'thank you';
UPDATE vocabulary_words SET meaning_en = 'a polite word used when making a request' WHERE word = 'please';
UPDATE vocabulary_words SET meaning_en = 'feeling regret or apologizing' WHERE word = 'sorry';

UPDATE vocabulary_words SET meaning_en = 'the number 1' WHERE word = 'one';
UPDATE vocabulary_words SET meaning_en = 'the number 2' WHERE word = 'two';
UPDATE vocabulary_words SET meaning_en = 'the number 3' WHERE word = 'three';
UPDATE vocabulary_words SET meaning_en = 'the number 10' WHERE word = 'ten';

UPDATE vocabulary_words SET meaning_en = 'the color of blood or fire' WHERE word = 'red';
UPDATE vocabulary_words SET meaning_en = 'the color of the sky or sea' WHERE word = 'blue';
UPDATE vocabulary_words SET meaning_en = 'the color of grass or leaves' WHERE word = 'green';
UPDATE vocabulary_words SET meaning_en = 'the color of the sun or butter' WHERE word = 'yellow';

UPDATE vocabulary_words SET meaning_en = 'a female parent' WHERE word = 'mother';
UPDATE vocabulary_words SET meaning_en = 'a male parent' WHERE word = 'father';
UPDATE vocabulary_words SET meaning_en = 'a female sibling' WHERE word = 'sister';
UPDATE vocabulary_words SET meaning_en = 'a male sibling' WHERE word = 'brother';

UPDATE vocabulary_words SET meaning_en = 'a clear liquid essential for life' WHERE word = 'water';
UPDATE vocabulary_words SET meaning_en = 'a hot drink made from roasted beans' WHERE word = 'coffee';
UPDATE vocabulary_words SET meaning_en = 'a grain used as a staple food' WHERE word = 'rice';
UPDATE vocabulary_words SET meaning_en = 'a round fruit that grows on trees' WHERE word = 'apple';

UPDATE vocabulary_words SET meaning_en = 'to move from one place to another' WHERE word = 'go';
UPDATE vocabulary_words SET meaning_en = 'to move toward or arrive at a place' WHERE word = 'come';
UPDATE vocabulary_words SET meaning_en = 'to consume food' WHERE word = 'eat';
UPDATE vocabulary_words SET meaning_en = 'to consume liquid' WHERE word = 'drink';
UPDATE vocabulary_words SET meaning_en = 'to rest with eyes closed' WHERE word = 'sleep';
UPDATE vocabulary_words SET meaning_en = 'to learn or examine something' WHERE word = 'study';

UPDATE vocabulary_words SET meaning_en = 'of great significance or value' WHERE word = 'important';
UPDATE vocabulary_words SET meaning_en = 'hard to do or understand' WHERE word = 'difficult';
UPDATE vocabulary_words SET meaning_en = 'pleasing to the eye or mind' WHERE word = 'beautiful';
UPDATE vocabulary_words SET meaning_en = 'arousing curiosity or attention' WHERE word = 'interesting';

UPDATE vocabulary_words SET meaning_en = 'to achieve or complete successfully' WHERE word = 'accomplish';
UPDATE vocabulary_words SET meaning_en = 'something accomplished successfully' WHERE word = 'achievement';
UPDATE vocabulary_words SET meaning_en = 'a particular way of viewing things' WHERE word = 'perspective';
UPDATE vocabulary_words SET meaning_en = 'complex, refined, or worldly' WHERE word = 'sophisticated';
