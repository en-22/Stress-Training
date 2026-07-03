import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import "../styles/questions.css";
import { questionCount, wordCount } from "./HomePage";

/* As respostas do usuário são adicionadas a uma lista e enviadas ao final ao back para gerar a página de resultados */
export default function QuestionPage() {
    const { id } = useParams(); // Index da questão da página atual

    const navigate = useNavigate();

    const [questions, setQuestions] = useState(() => { // Questionário
        try {
            const saved = JSON.parse(localStorage.getItem("questions"));
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    });

    const [currentIndex, setCurrentIndex] = useState(() => { // Id da questão atual
        const saved = Number(localStorage.getItem("currentIndex"));
        return Number.isFinite(saved) ? saved : 0;
    });

    const [firstTry, setFirstTry] = useState(() => { // Boolean da primeira tentativa do usuário na questão, controla número da tentaiva
        const saved = localStorage.getItem("firstTry");
        if(Boolean(saved)) {
            return saved === "true";
        } else {
            return true;
        }
    });

    const [finalized, setFinalized] = useState(() => { // Boolean da finalização do questionário 
        const saved = localStorage.getItem("finalized");
        if(Boolean(saved)) {
            return saved === "true";
        } else {
            return false;
        }
    });

    const [showModal, setShowModal] = useState(false); // Indica se o Pop-up está na tela ou não 

    const [isCorrect, setIsCorrect] = useState(false); // Boolean da corretude da tentativa atual 

    useEffect(() => {
        localStorage.setItem("firstTry", firstTry.toString());
    }, [firstTry]);

    useEffect(() => {
        localStorage.setItem("currentIndex", currentIndex.toString());
    }, [currentIndex]);

    useEffect(() => {
        localStorage.setItem('questions', JSON.stringify(questions));
    }, [questions]);

    useEffect(() => {
        localStorage.setItem('finalized', JSON.stringify(finalized));
    }, [finalized]);

    useEffect(() => {
        const storedQuestions = localStorage.getItem('questions'); // Tenta restaurar questionário do cache

        if (!storedQuestions || JSON.parse(storedQuestions).length === 0) {
            async function createQuestions() {
                const randomNums = new Set(); // Usei Set pra garantir que não haveriam palavras repetidas
                const questionSet = [];
                while (randomNums.size < questionCount) { // Adiciona ids aleatórios das palavras no Set, até que haja a quantidade desejada de valores diferentes
                    randomNums.add(Math.floor(Math.random() * wordCount) + 1);
                }

                if(!localStorage.getItem("userId")){
                    localStorage.clear();
                    navigate('/'); // Se não achou userId no cache, volta pra home, que irá criar um
                } else { // Usa os Ids do Set para buscar as palavras no back
                    for(const num of randomNums){
                        const aux = await fetch("/api/createQuestion", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ word_id: num, user_id: Number(localStorage.getItem("userId")) }),
                        }).then((res) => res.json())
                        questionSet.push(aux);
                    }

                    if (!Array.isArray(questionSet) || questionSet.length === 0) {
                        console.error("No questions returned!");
                        return;
                    }

                    setQuestions(questionSet);

                    localStorage.setItem('firstTry', "true");
                    localStorage.setItem('currentIndex', "0");
                    localStorage.setItem('finalized', "false");
                    
                    if (id !== questionSet[0].data.id) {
                        navigate(`/question/${questionSet[0].data.id}`); // Redireciona à primeira questão
                    }
                }
            }
            
            createQuestions();

        } else { // Restaura sessão anterior pelo cache
            const storedQuestions = JSON.parse(localStorage.getItem('questions'));
            const storedFirstTry = localStorage.getItem('firstTry') === 'true';
            const storedCurrentIndex = Math.min(
                parseInt(localStorage.getItem("currentIndex"), 10) || 0,
                storedQuestions.length - 1
            );
            const storedFinalized = localStorage.getItem('finalized') === 'true';
            
            setQuestions(storedQuestions);
            setFirstTry(storedFirstTry);
            setCurrentIndex(storedCurrentIndex);
            setFinalized(storedFinalized);
            
            if (
                Array.isArray(storedQuestions) &&
                storedQuestions.length > 0 &&
                storedQuestions[storedCurrentIndex]?.data
            ) {
                navigate(`/question/${storedQuestions[storedCurrentIndex].data.id}`);
            } else { // Se houve erro na restauração, apaga o cache e redireciona pra Home
                console.warn("Stored data invalid, regenerating...");
                localStorage.clear();
                navigate('/');
            }
        }
    }, [navigate]);

    async function UpdtQuestionAnswer(questions) {
        const promises = Array.from(questions).map((question) => {
            fetch(`/api/answerQuestion/${question.data.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({answer: question.data.answer}),
            });
        })
        await Promise.all(promises);
    }

    async function answerQuestion(stress_silable) { // Verifica a se a resposta do usuário ao questionário está correta
        const res = await fetch(`/api/checkAnswer/${questions[currentIndex].data.wordId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stress_silable }),
        });
    
        const data = await res.json();

        const correct = await data.correct;
        setIsCorrect(correct === "true"); // Verifica se resposta está correta
        setShowModal(true); // Mostra o pop-up
        
        if(firstTry && !(correct === "true")){ // Atualiza firstTry para indicar a tentiva
            setFirstTry(false);
            return;
        }

        const answerType =
            firstTry && correct === "true"
            ? "CORRECT_1"
            : correct === "true"
            ? "CORRECT_2"
            : "INCORRECT";

        setQuestions(prev => { // Adiciona a resposta do usuário á questão na lista de questões 
            const updated = [...prev];
            updated[currentIndex].data.answer = answerType;
            return updated;
        });

        const nextIndex = currentIndex + 1;
        if (nextIndex < questions.length) { // Navega para a próxima questão
            setCurrentIndex(nextIndex);
            setFirstTry(true);

            navigate(`/question/${questions[nextIndex].data.id}`);
        } else { // ou atualiza as variáveis para indicar o fim do questionário
            setFinalized("true");
            setShowModal(true);
            UpdtQuestionAnswer(questions);
            localStorage.removeItem('firstTry');
        }
    }

    const currentAudioUrl = useMemo(() => { // Pega o aúdio certo de acordo com a tentativa
        if (!questions?.[currentIndex]?.data) return null;

        return firstTry
            ? `/api/getAudio/${questions[currentIndex].data.wordAudioNS}`
            : `/api/getAudio/${questions[currentIndex].data.wordAudioWS}`;
    }, [firstTry, currentIndex, questions]);


    const playAudio = () => {
        const audio = new Audio(currentAudioUrl);
        audio.volume = 0.5;
        audio.play();
    };
    
    return (
        <>
        <div className="question-panel">
            <div className="question-title">Questão: {currentIndex+1}/10</div>
            <div className="question-subtitle">Tentativa: {firstTry ? 1 : 2}/2</div>

            <div className="audio-container">
                {currentAudioUrl && ( <button key={currentAudioUrl} onClick={playAudio}>▶</button>)}
            </div>

            
            {showModal && isCorrect && !finalized && ( /* Pop-up para o acerto da questão*/
                <div className="modal-background">
                    <div className="modal-box">
                    <h2>Correto!</h2>
                    <button onClick={() => setShowModal(false)}>Próximo</button>
                    </div>
                </div>
            )}

            {showModal && !isCorrect && !finalized && ( /* Pop-up para o não acerto da questão. Se é primeira tentativa, ativa a segunda, caso contrário, leva à próxima questão*/
                <div className="modal-background">
                    <div className="modal-box">
                    <h2>Incorreto!</h2>
                    <button onClick={() => setShowModal(false)}>{firstTry ? ("Próximo") : ("Tentar Novamente")}</button> 
                    </div>
                </div>
            )}

            {showModal && finalized &&( /* Pop-up para finalização do questionário */
                <div className="modal-background">
                    <div className="modal-box">
                    <h2>{isCorrect ? ("Correto!") : ("Incorreto!")}</h2>
                    <button onClick={() => {
                            setShowModal(false);
                            navigate("/results");
                        }
                    }
                    >Finalizar</button>
                    </div>
                </div>
            )}

            <div className="button-row">
                <button onClick={() => answerQuestion('OXYTONE')} ></button>
                <button onClick={() => answerQuestion('PAROXYTONE')} ></button>
                <button onClick={() => answerQuestion('PROPAROXYTONE')} ></button>
                <button onClick={() => answerQuestion('PREPROPAROXYTONE')}></button>
            </div>
        </div>
        </>
    );
}      
