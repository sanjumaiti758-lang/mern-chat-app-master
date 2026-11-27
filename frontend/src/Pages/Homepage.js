import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorMode,
  IconButton,
  Flex,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useHistory } from "react-router";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";
import { ChatState } from "../Context/ChatProvider";

function Homepage() {
  const history = useHistory();
  const { colorMode, toggleColorMode } = useColorMode();
  const { setThemeMode } = ChatState() || {};
  const isDark = colorMode === "dark";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));
    if (user) history.push("/chats");
  }, [history]);

  const handleToggleTheme = () => {
    const nextMode = isDark ? "light" : "dark";
    if (setThemeMode) {
      setThemeMode(nextMode);
    } else {
      toggleColorMode();
    }
  };

  return (
    <Container maxW="xl" centerContent pb={8}>
      <Box
        d="flex"
        justifyContent="space-between"
        alignItems="center"
        p={4}
        bg={isDark ? "#202C33" : "white"}
        w="100%"
        m="40px 0 15px 0"
        borderRadius="xl"
        borderWidth="1px"
        borderColor={isDark ? "#2A3942" : "#E2E8F0"}
        boxShadow={isDark ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.06)"}
      >
        <Box width="40px" />
        <Flex direction="column" alignItems="center">
          <Text
            fontSize="4xl"
            fontFamily="Work sans"
            fontWeight="bold"
            color={isDark ? "#E9EDEF" : "#111B21"}
            letterSpacing="tight"
          >
            Talk-A-Tive
          </Text>
          <Text
            fontSize="xs"
            color={isDark ? "#8696A0" : "#64748B"}
            fontWeight="medium"
          >
            Real-time chat & communication
          </Text>
        </Flex>
        <IconButton
          aria-label="Toggle theme"
          icon={isDark ? <SunIcon /> : <MoonIcon />}
          size="sm"
          isRound
          variant="ghost"
          color={isDark ? "#F59E0B" : "#4B5563"}
          _hover={{ bg: isDark ? "#2A3942" : "#F1F5F9" }}
          onClick={handleToggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        />
      </Box>

      <Box
        bg={isDark ? "#202C33" : "white"}
        w="100%"
        p={6}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={isDark ? "#2A3942" : "#E2E8F0"}
        boxShadow={isDark ? "0 8px 30px rgba(0,0,0,0.55)" : "0 8px 30px rgba(0,0,0,0.08)"}
      >
        <Tabs isFitted variant="soft-rounded">
          <TabList
            mb="1.5em"
            bg={isDark ? "#111B21" : "#F1F5F9"}
            p="4px"
            borderRadius="lg"
          >
            <Tab
              fontWeight="semibold"
              fontSize="sm"
              color={isDark ? "#8696A0" : "#64748B"}
              _selected={{
                color: "white",
                bg: "#00A884",
                fontWeight: "bold",
                boxShadow: "0 2px 8px rgba(0, 168, 132, 0.4)",
              }}
              borderRadius="md"
              transition="all 0.2s ease"
            >
              Login
            </Tab>
            <Tab
              fontWeight="semibold"
              fontSize="sm"
              color={isDark ? "#8696A0" : "#64748B"}
              _selected={{
                color: "white",
                bg: "#00A884",
                fontWeight: "bold",
                boxShadow: "0 2px 8px rgba(0, 168, 132, 0.4)",
              }}
              borderRadius="md"
              transition="all 0.2s ease"
            >
              Sign Up
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0}>
              <Login />
            </TabPanel>
            <TabPanel p={0}>
              <Signup />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}

export default Homepage;
