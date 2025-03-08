const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateSimilarQuestions = async (question) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Generate 3 questions similar to: "${question}". Return only the questions as a bullet-point list without any additional text.`;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().split('\n').filter(q => q.trim());
  } catch (error) {
    console.error('Gemini API error:', error);
    return [];
  }
};

const generateNewQuestion = async (topic, contextQuestions) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = contextQuestions.length > 0
    ? `Based on these existing questions about ${topic}:\n${contextQuestions.join('\n')}\n\nGenerate 1 new related question. Return only the question without any additional text.`
    : `Generate 1 question about ${topic}. Return only the question without any additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
};

module.exports = { generateSimilarQuestions, generateNewQuestion };