import { Routes, Route } from "react-router-dom";
import { routes } from "./routes/AppRoutes";
import Layout from "./components/layout/Layout";

function App() {
  return (
    <div className="max-w-7xl mx-auto">
      <Routes>
        <Route path="/" element={<Layout />}>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </div>
  );
}

export default App;
