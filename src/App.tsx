import { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router";
import { useTranslation } from "react-i18next";
import { AppRoutes } from "./constants/routes";
import { configApi, CONFIG_KEYS } from "./api/database";
import Home from "./pages/Home";
import About from "./pages/About";
import ConfigEdit from "./pages/ConfigEdit";
import SystemConfig from "./pages/SystemConfig";
import CommandLog from "./pages/CommandLog";
import "./App.css";

// ==================== 主组件 ====================

function App() {
  const { i18n } = useTranslation();

  // 应用启动时加载语言配置
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const languageValue = await configApi.get(CONFIG_KEYS.LANGUAGE);
        if (languageValue) {
          i18n.changeLanguage(languageValue);
        }
      } catch (error) {
        console.error("Failed to load language config:", error);
        // 静默失败，使用默认语言
      }
    };

    loadLanguage();
  }, [i18n]);

  return (
    <HashRouter>
      <Routes>
        <Route path={AppRoutes.HOME} element={<Home />} />
        <Route path={AppRoutes.ABOUT} element={<About />} />
        <Route path={AppRoutes.CONFIG_EDIT} element={<ConfigEdit />} />
        <Route path={AppRoutes.SYSTEM_CONFIG} element={<SystemConfig />} />
        <Route path="/log/:commandId" element={<CommandLog />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
