require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Question = require('./models/Question');
const Topic = require('./models/Topic');
const { generateSimilarQuestions, generateNewQuestion } = require('./utils/gemini');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Similar questions endpoint
app.post('/api/similar-questions', async (req, res) => {
  try {
    const { question } = req.body;
    
    // Generate similar questions using Gemini
    const generatedQuestions = await generateSimilarQuestions(question);
    
    // Save original question
    const newQuestion = new Question({ text: question, type: 'user' });
    await newQuestion.save();
    
    // Save generated questions
    const questionsToSave = generatedQuestions.map(text => ({ text, type: 'generated' }));
    await Question.insertMany(questionsToSave);
    
    res.json({ similarQuestions: generatedQuestions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate new question endpoint
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { topic } = req.body;
    
    // Find or create topic
    let existingTopic = await Topic.findOne({ name: topic.toLowerCase() });
    if (!existingTopic) {
      existingTopic = new Topic({ name: topic.toLowerCase() });
      await existingTopic.save();
    }
    
    // Check existing questions for this topic
    const existingQuestions = await Question.find({ topic: existingTopic._id });
    
    let newQuestion;
    if (existingQuestions.length > 0) {
      // Generate based on existing questions
      newQuestion = await generateNewQuestion(topic, existingQuestions.map(q => q.text));
    } else {
      // Generate completely new question
      newQuestion = await generateNewQuestion(topic, []);
    }
    
    // Save the new question
    const savedQuestion = new Question({ 
      text: newQuestion, 
      type: 'generated',
      topic: existingTopic._id
    });
    await savedQuestion.save();
    
    // Update topic count
    existingTopic.count++;
    await existingTopic.save();
    
    res.json({ newQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));