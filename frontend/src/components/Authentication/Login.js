import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input, InputGroup, InputRightElement } from "@chakra-ui/input";
import { VStack } from "@chakra-ui/layout";
import { useState } from "react";
import axios from "axios";
import { useToast, useColorMode } from "@chakra-ui/react";
import { useHistory } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";

const Login = () => {
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);
  const toast = useToast();
  const { colorMode } = useColorMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const history = useHistory();
  const { setUser } = ChatState();

  const isDark = colorMode === "dark";

  const submitHandler = async () => {
    setLoading(true);
    if (!email || !password) {
      toast({
        title: "Please Fill all the Feilds",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const { data } = await axios.post(
        "/api/user/login",
        { email, password },
        config
      );

      toast({
        title: "Login Successful",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setUser(data);
      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      history.push("/chats");
    } catch (error) {
      toast({
        title: "Error Occured!",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to Login. Server may be down.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  };

  return (
    <VStack spacing="15px">
      <FormControl id="login-email" isRequired>
        <FormLabel
          color={isDark ? "#E9EDEF" : "#111B21"}
          fontWeight="600"
          fontSize="sm"
          mb="6px"
        >
          Email Address
        </FormLabel>
        <Input
          value={email}
          type="email"
          placeholder="Enter Your Email Address"
          onChange={(e) => setEmail(e.target.value)}
          bg={isDark ? "#2A3942" : "#F8FAFC"}
          color={isDark ? "#FFFFFF" : "#0F172A"}
          borderColor={isDark ? "#3E4F5B" : "#CBD5E1"}
          _placeholder={{
            color: isDark ? "#8696A0" : "#64748B",
            opacity: 1,
          }}
          _hover={{
            borderColor: isDark ? "#00A884" : "#94A3B8",
          }}
          _focus={{
            borderColor: "#00A884",
            boxShadow: "0 0 0 1px #00A884",
            bg: isDark ? "#2A3942" : "#FFFFFF",
          }}
          borderRadius="md"
          height="42px"
          fontSize="sm"
        />
      </FormControl>

      <FormControl id="login-password" isRequired>
        <FormLabel
          color={isDark ? "#E9EDEF" : "#111B21"}
          fontWeight="600"
          fontSize="sm"
          mb="6px"
        >
          Password
        </FormLabel>
        <InputGroup size="md">
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={show ? "text" : "password"}
            placeholder="Enter password"
            bg={isDark ? "#2A3942" : "#F8FAFC"}
            color={isDark ? "#FFFFFF" : "#0F172A"}
            borderColor={isDark ? "#3E4F5B" : "#CBD5E1"}
            _placeholder={{
              color: isDark ? "#8696A0" : "#64748B",
              opacity: 1,
            }}
            _hover={{
              borderColor: isDark ? "#00A884" : "#94A3B8",
            }}
            _focus={{
              borderColor: "#00A884",
              boxShadow: "0 0 0 1px #00A884",
              bg: isDark ? "#2A3942" : "#FFFFFF",
            }}
            borderRadius="md"
            height="42px"
            fontSize="sm"
          />
          <InputRightElement width="4.5rem" height="42px">
            <Button
              h="1.85rem"
              size="sm"
              onClick={handleClick}
              bg={isDark ? "#3E4F5B" : "#E2E8F0"}
              color={isDark ? "#E9EDEF" : "#334155"}
              _hover={{ bg: isDark ? "#4F6372" : "#CBD5E1" }}
              fontSize="xs"
              fontWeight="medium"
            >
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <Button
        bg="#00A884"
        color="white"
        _hover={{ bg: "#008f6f" }}
        width="100%"
        height="44px"
        style={{ marginTop: 15 }}
        onClick={submitHandler}
        isLoading={loading}
        fontWeight="bold"
        fontSize="md"
        borderRadius="md"
        boxShadow="0 4px 12px rgba(0, 168, 132, 0.3)"
      >
        Login
      </Button>

      <Button
        variant="solid"
        bg={isDark ? "#DC2626" : "#EF4444"}
        color="white"
        _hover={{ bg: "#B91C1C" }}
        width="100%"
        height="40px"
        onClick={() => {
          setEmail("guest@example.com");
          setPassword("123456");
        }}
        fontWeight="semibold"
        fontSize="sm"
        borderRadius="md"
      >
        Get Guest User Credentials
      </Button>
    </VStack>
  );
};

export default Login;
