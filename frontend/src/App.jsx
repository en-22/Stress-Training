import React from 'react';
import appRoutes from './routes/AppRoutes.jsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';


function App() {
  return (<RouterProvider router={createBrowserRouter(appRoutes)} />);
}

export default App;
