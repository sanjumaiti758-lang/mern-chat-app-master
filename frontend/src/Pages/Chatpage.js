import { Box } from "@chakra-ui/layout";
import { useState } from "react";
import Chatbox from "../components/Chatbox";
import MyChats from "../components/MyChats";
import SideDrawer from "../components/miscellaneous/SideDrawer";
import { ChatState } from "../Context/ChatProvider";
import { useColorMode } from "@chakra-ui/react";

const Chatpage = () => {
  const [fetchAgain, setFetchAgain] = useState(false);
  const { user } = ChatState();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(to bottom, #00A884 0px, #00A884 128px, #0C1317 128px, #0C1317 100%)"
          : "linear-gradient(to bottom, #00A884 0px, #00A884 128px, #D1D7DB 128px, #D1D7DB 100%)",
        transition: "background 0.3s ease",
      }}
    >
      {user && <SideDrawer />}
      <Box
        d="flex"
        justifyContent="space-between"
        w="100%"
        h="91.5vh"
        p="10px"
        gap="10px"
      >
        {user && <MyChats fetchAgain={fetchAgain} />}
        {user && (
          <Chatbox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        )}
      </Box>
    </div>
  );
};

export default Chatpage;
