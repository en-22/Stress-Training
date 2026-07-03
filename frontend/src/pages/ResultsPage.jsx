import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/results.css";
import { questionCount } from "./HomePage";

export default function ResultsPage() {
    const navigate = useNavigate();
    const storedCurrentIndex = Number(localStorage.getItem('currentIndex'));
    const storedQuestions = JSON.parse(localStorage.getItem('questions'));
    let hits = 0; // Número de acertos, seja na primeira ou segunda tentativa

    if(storedCurrentIndex === questionCount - 1){
        Array.from(storedQuestions).map((question) => {            
            if(question.data.answer !== "INCORRECT")
                hits++;
        });
    } else { // Impede que o usuário acesse o Results sem ter terminado o questionário
        useEffect(() => {
            navigate(`/question/${storedQuestions[storedCurrentIndex].data.id}`);
        }, [navigate]);
    }

    async function home(){ // Redireciona à Home
        localStorage.removeItem('questions');
        localStorage.removeItem('currentIndex')
        navigate('/');
    }

    return (
        <>
            <div className="panel">
                <h3>Sua pontuação:</h3>
                <div className="btn">{hits} / {questionCount}</div>
                <button onClick={() => home()}>Continuar</button>
            </div>
        </>
    );
}
