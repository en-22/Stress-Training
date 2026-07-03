import "../styles/home.css";
import { useNavigate } from "react-router-dom";

export const questionCount = 10; // Número de questões em um questionário
export const wordCount = 200;/*  Quantas palavras da lista poderão ser escolhidas, deveria ser o número total de palavras,
    mas eu só descobri depois que tinha repetição de palavras com vozes diferentes, e página de Statistics vai mostrar valores errados se o wordCount for o valor correto.
        Há mais comentários sobre no questionController.ts */

export default function HomePage() {
    const navigate = useNavigate();

    // Dados da sessão anterior que estavam no cache
    const storedQuestions = localStorage.getItem('questions'); // Questões do questionário anterior
    const storedFinalized = localStorage.getItem('finalized'); // Variável que indica se o questionário anterior foi finalizado ou não
    const storedFirstTry = localStorage.getItem('firstTry'); // Variável que indica se aquela é a primeira tentativa do usuário na questão na qual ele se encontra
    const storedCurrentIndex = localStorage.getItem('currentIndex'); // Posição atual do usuário no questionário, vulgo, id da questão na qual ele se encontra

    // Tenta restaurar os dados da sessão anterior
    async function tryToContinueFromCache(){
        if(storedQuestions !== null && storedFirstTry !== null && storedCurrentIndex !== null){ // Dados necessários para restaurar a sessão
            alert("Detectamos um questionário pendente.");
            navigate(`/question/${JSON.parse(storedQuestions)[storedCurrentIndex].data.id}`);
        } else { // Se algum daqueles dados não estiver disponível/existir/válido, apaga tudo do cache, exceto o user id, se existir      
            localStorage.removeItem('questions');
            localStorage.removeItem('finalized');
            localStorage.removeItem('firstTry');
            localStorage.removeItem('currentIndex');
        }
    }

    // Cria um usuário; ele é identificado só pelo id para que não exista login no sistema, se o dado daquele id for apagado, eventualmente outro id será criado pro
    // usuário, mas suas respostas relacionadas ao id anterior continuaram no sistema, apenas não serão relacionadas a seu novo id
    async function getUser() {
        const user = await fetch(`/api/createUser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        const userData = await user.json();
    
        localStorage.setItem("userId", String(userData.data.id)); // Adiciona dado do id ao cache
    }


    async function initiate(){
        if(localStorage.getItem('userId') === null){ // Tenta restaurar id do usuário do cache
            if(storedQuestions !== null)
                localStorage.clear(); // Garante que o cache está limpo
            await getUser();
        }else{
            if(storedFinalized === "false") // Se o questionário ainda não foi finalizado, tenta continuar pelo cache. Caso, tenho sido finalizado,
                tryToContinueFromCache();                       // o "navigate('/question')" vai acabar levando à ResultsPage
        }

        navigate('/question');
    }

    return (
        <>
            <div className="home-panel">
                <button
                    onClick={initiate}>Começar
                </button>
            </div>
        </>
    );
}
