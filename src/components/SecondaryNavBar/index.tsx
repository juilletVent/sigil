import { Button } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { AppRoutes } from "../../constants/routes";
import { NavBarContainer, BackButton } from "./styles";

/**
 * 二级页面导航栏
 * 提供返回到首页的功能
 */
function SecondaryNavBar() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(AppRoutes.HOME);
  };

  return (
    <NavBarContainer>
      <BackButton>
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={handleBack}
          title="返回"
        >
          返回
        </Button>
      </BackButton>
    </NavBarContainer>
  );
}

export default SecondaryNavBar;

