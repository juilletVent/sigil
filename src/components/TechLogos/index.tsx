import styled from "styled-components";
import { openUrl } from "@tauri-apps/plugin-opener";
import tauriLogo from "../../assets/logos/tauri.svg";
import reactLogo from "../../assets/logos/react.svg";
import typescriptLogo from "../../assets/logos/typescript.svg";
import antdLogo from "../../assets/logos/antd.svg";
import styledComponentsLogo from "../../assets/logos/styled-components.svg";
import reactRouterLogo from "../../assets/logos/react-router.svg";
import viteLogo from "../../assets/logos/vite.svg";
import rustLogo from "../../assets/logos/rust.svg";

// ==================== 样式组件 ====================

const TechStackGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 16px;
  max-width: 500px;
  gap: 6px 6px;
  margin-left: auto;
  margin-right: auto;
`;

const TechCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 0px;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background-color: #f0f0f0;
  }

  @media (prefers-color-scheme: dark) {
    &:hover {
      background-color: #333;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }
`;

const LogoImage = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
`;

const TechName = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #333;
  text-align: center;

  @media (prefers-color-scheme: dark) {
    color: #ccc;
  }
`;

// ==================== 主组件 ====================

interface TechItem {
  name: string;
  logo: string;
  url: string;
}

const techStack: TechItem[] = [
  {
    name: "Tauri",
    logo: tauriLogo,
    url: "https://tauri.app/",
  },
  {
    name: "Rust",
    logo: rustLogo,
    url: "https://www.rust-lang.org/",
  },
  {
    name: "React",
    logo: reactLogo,
    url: "https://react.dev/",
  },
  {
    name: "TypeScript",
    logo: typescriptLogo,
    url: "https://www.typescriptlang.org/",
  },
  {
    name: "Vite",
    logo: viteLogo,
    url: "https://vitejs.dev/",
  },
  {
    name: "Ant Design",
    logo: antdLogo,
    url: "https://ant.design/",
  },
  {
    name: "Styled Components",
    logo: styledComponentsLogo,
    url: "https://styled-components.com/",
  },
  {
    name: "React Router",
    logo: reactRouterLogo,
    url: "https://reactrouter.com/",
  },
];

export default function TechLogos() {
  const handleClick = async (url: string) => {
    try {
      await openUrl(url);
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  return (
    <TechStackGrid>
      {techStack.map((tech) => (
        <TechCard key={tech.name} onClick={() => handleClick(tech.url)}>
          <LogoImage src={tech.logo} alt={tech.name} />
          <TechName>{tech.name}</TechName>
        </TechCard>
      ))}
    </TechStackGrid>
  );
}
