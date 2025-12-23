import { BrowserRouter, Routes, Route } from "react-router";
import { AppRoutes } from "./constants/routes";
import Home from "./pages/Home";
import About from "./pages/About";
import ConfigEdit from "./pages/ConfigEdit";
import SystemConfig from "./pages/SystemConfig";
import "./App.css";

// ==================== 主组件 ====================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={AppRoutes.HOME} element={<Home />} />
        <Route path={AppRoutes.ABOUT} element={<About />} />
        <Route path={AppRoutes.CONFIG_EDIT} element={<ConfigEdit />} />
        <Route path={AppRoutes.SYSTEM_CONFIG} element={<SystemConfig />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
