import QuestionPage from '../pages/QuestionsPage';
import HomePage from '../pages/HomePage'
import ResultsPage from '../pages/ResultsPage'
import StatisticsPage from '../pages/StatisticsPage'

const appRoutes = [
    {path: '/statistics', element: <StatisticsPage />}, //Estatísticas sobre todas as respostas recebidas dos usuários
    {path: '/results', element: <ResultsPage />}, //Resultado do último questionário completo pelo usuário
    {path: '/question/:id', element: <QuestionPage />}, // Questão de identificador 'id' do questionário
    {path: '/question', element: <QuestionPage />}, //Página que cria o questionário e te redireciona as questões dele
    {path: '/', element: <HomePage />} //Página inicial
]

export default appRoutes;