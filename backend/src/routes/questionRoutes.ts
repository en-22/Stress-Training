import express from 'express';
import{
    createQuestion,
    updateQuestionAnswer,
    getQuestion,
    getWord,
    checkAnswer,
    getAudio,
    createUser,
    getWordStats,
    getAllWordStats,
    deleteQuestion,
} from '../controllers/questionController'

const router = express.Router();

router.post('/createQuestion', createQuestion);
router.post('/createUser', createUser)
router.put('/answerQuestion/:id', updateQuestionAnswer);
router.put('/checkAnswer/:id', checkAnswer);
router.get('/getQuestion/:id', getQuestion);
router.get('/getWord/:id', getWord);
router.get('/getAudio/:id', getAudio);
router.get('/getWordStats/:id', getWordStats);
router.get('/getAllWordStats', getAllWordStats);
router.delete('/deleteQuestion', deleteQuestion);

export default router;