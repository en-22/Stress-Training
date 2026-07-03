import express, { Request, Response } from 'express';
import { answer_type, stress_silable_type } from '@prisma/client';
import prisma from '../services/prismaClient';
import * as yup from 'yup';
import path from "path";
import fs from "fs";

export const createQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const createQuestionSchema = yup
        .object()
        .shape({
            id: yup.number().min(0),
            answer: yup.mixed<answer_type>().oneOf(Object.values(answer_type)),
            user_id: yup.number().min(0),//.required(),
            word_id: yup.number().min(0),//.required(),
        })
        .noUnknown();

        const question = await createQuestionSchema.validate(req.body, {stripUnknown: false});
    
        const createdQuestion = await prisma.$transaction(async(prisma) => {
            const createdQuestion = await prisma.question.create({
                data: {
                    answer: null,
                    word: { connect: { id: question.word_id } },
                    user: { connect: { id: question.user_id } }
                },
            });
            
            return await prisma.question.findUnique({where: {id: createdQuestion.id}});
        });

        if (!createdQuestion) {
            res.status(500).json({ error: "Question creation failed." });
            return;
        }

        const word = await prisma.word.findUnique({where: {id: createdQuestion.word_id}});

        if (!word) {
            res.status(500).json({ error: "Word not found." });
            return;
        }

        res.locals.message = 'Question created.';
        res.status(201).json({
            message: res.locals.message, 
            data: {
                id: createdQuestion.id,
                wordId: word.id,
                wordLetters: word.letters,
                wordAudioNS: word.audio_no_stress,
                wordAudioWS: word.audio_with_stress,
            }
        });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

export const updateQuestionAnswer = async (req: Request, res: Response): Promise<void> => {
    try {
        const questionId: number = parseInt(req.params.id);

        const updateQuestionSchema = yup
        .object()
        .shape({
            id: yup.number().min(0),
            answer: yup.mixed<answer_type>().oneOf(Object.values(answer_type)),//.required(),
            user_id: yup.number().min(0),//.required(),
            word_id: yup.number().min(0),//.required(),
        })
        .noUnknown();

        const question = await updateQuestionSchema.validate(req.body, {stripUnknown: false});

        const updatedQuestion = await prisma.$transaction(async(prisma) => {
            const updatedQuestion = await prisma.question.update({
                where: {id: questionId},
                data: {
                    answer: question.answer,
                },
            });
            
            return await prisma.question.findUnique({where: {id: updatedQuestion.id}});
        });

        res.locals.message = 'Question updated.';
        res.status(200).json({message: res.locals.message, data: updatedQuestion});

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

export const getQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const questionId: number = parseInt(req.params.id);
        const question = await prisma.question.findUnique({where: {id: questionId}});

        if (!question) {
            res.status(404).json({ error: "Question not found" });
            return;
        }

        res.status(200).json(question);

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const questionId: number = parseInt(req.params.id);
        if(questionId < 0){
            res.status(400).json({ error: 'Negative Id' });
            return;
        }

        const question = await prisma.question.findUnique({where: {id: questionId}});

        if(!question){
            res.status(404).json({ error: 'Question not found' });
            return;
        }

        await prisma.question.delete({where:{id: questionId}});
        res.locals.message = 'Question deleted';
        res.status(200).json({message: res.locals.message});

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

export const getWord = async (req: Request, res: Response): Promise<void> => {
    try {
        const wordId: number = parseInt(req.params.id);
        const word = await prisma.word.findUnique({where: {id: wordId}});

         if (!word) {
            res.status(404).json({ error: "Word not found" });
            return;
        }

        res.locals.message = 'Word fetched.';
        res.status(201).json({
            message: res.locals.message, 
            data: {
                wordLetters: word.letters,
                wordAudioNS: word.audio_no_stress,
                wordAudioWS: word.audio_with_stress,
            }
        });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

/* OBS: como eu só descobri depois que tinha repetição de palavras com vozes diferentes, se o valor de wordCount em HomePage.jsx for aumentado
    as funções de Stats retornariam mais de uma vez a mesma palavra, porque ele busca pelo id, não pela palavra em si, isso deve ser arrumado */
export const getWordStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const wordId: number = parseInt(req.params.id);
        /* SQL puro porque queria algo específico */
        /* Retornar a quantidade de cada tipo de resposta de uma palavra */
        const results = await prisma.$queryRaw`
        SELECT
            w.letters AS letters,
            SUM(q.answer = 'CORRECT_1') AS CORRECT_1,
            SUM(q.answer = 'CORRECT_2') AS CORRECT_2,
            SUM(q.answer = 'INCORRECT') AS INCORRECT
        FROM Question q
        JOIN Word w ON w.id = q.word_id
        WHERE q.answer IS NOT NULL
            AND q.word_id = ${wordId}
        GROUP BY w.letters;
        `;

        res.status(200).json({results});

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

export const getAllWordStats = async (req: Request, res: Response): Promise<void> => {
    try {
        /* SQL puro porque queria algo específico */
        /* Retornar a quantidade de cada tipo de resposta de todas as palavras que já apareceram em um questionário finalizado */
        const results = await prisma.$queryRaw`
        SELECT
            w.letters AS letters,
            SUM(q.answer = 'CORRECT_1') AS CORRECT_1,
            SUM(q.answer = 'CORRECT_2') AS CORRECT_2,
            SUM(q.answer = 'INCORRECT') AS INCORRECT
        FROM Question q
        JOIN Word w ON w.id = q.word_id
        WHERE q.answer IS NOT NULL
        GROUP BY w.letters
        ORDER BY w.letters ASC;
        `;

        res.status(200).json({results});

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

export const checkAnswer = async (req: Request, res: Response): Promise<void> => {
    try {
        const wordId: number = parseInt(req.params.id);
        const questionAnswer: stress_silable_type = req.body.stress_silable;

        const word = await prisma.word.findUnique({where: {id: wordId}});

        if(wordId < 0){
            res.status(400).json({ error: 'Negative Id' });
            return;
        }

        if(!word){
            res.status(404).json({ error: 'Word not found' });
            return;
        }

        if(word.stress_silable === questionAnswer)
            res.status(200).json({ correct: "true" })
        else
            res.status(200).json({ correct: "false" })

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

export const getAudio = async (req: Request, res: Response): Promise<void> => {
    try {
        const audioName: string = req.params.id;
        const filePath = path.join(__dirname, "../../audios", audioName);

        if(!fs.existsSync(filePath)){
            res.status(404).json({ error: 'File Not Found.' });
            return;
        }

        res.status(200).sendFile(filePath);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const createUserSchema = yup
        .object()
        .shape({
            id: yup.number().min(0),
        })
        .noUnknown();

        const user = await createUserSchema.validate(req.body, {stripUnknown: false});
    
        const createdUser = await prisma.$transaction(async(prisma) => {
            const createdUser = await prisma.user.create({});
            return await prisma.user.findUnique({where: {id: createdUser.id}});
        });
        
        if (!createdUser) {
            res.status(500).json({ error: "User creation failed." });
            return;
        }
        
        res.locals.message = 'User Created.';
        res.status(201).json({message: res.locals.message, data: {id: createdUser.id}});
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}