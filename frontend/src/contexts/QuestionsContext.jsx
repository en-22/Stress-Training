import { createContext, useState } from "react";
//Acho que não é mais necessário agora que as questões são acessadas por cache
export const QuestionsContext = createContext();

export function QuestionsProvider({ children }) {
  const [questions, setQuestions] = useState([]);
  return (
    <QuestionsContext.Provider value={{ questions, setQuestions }}>
      {children}
    </QuestionsContext.Provider>
  );
}
