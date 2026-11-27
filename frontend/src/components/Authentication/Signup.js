import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input, InputGroup, InputRightElement } from "@chakra-ui/input";
import { VStack } from "@chakra-ui/layout";
import { useToast, useColorMode } from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { useHistory } from "react-router";

const Signup = () => {
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);
  const toast = useToast();
  const history = useHistory();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmpassword, setConfirmpassword] = useState("");
  const [password, setPassword] = useState("");
  const [pic, setPic] = useState();
  const [picLoading, setPicLoading] = useState(false);

  const submitHandler = async () => {
    setPicLoading(true);
    if (!name || !email || !password || !confirmpassword) {
      toast({
        title: "Please Fill all the Feilds",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
      return;
    }
    if (password !== confirmpassword) {
      toast({
        title: "Passwords Do Not Match",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
      return;
    }
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const { data } = await axios.post(
        "/api/user",
        {
          name,
          email,
          password,
          pic,
        },
        config
      );
      toast({
        title: "Registration Successful",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      setPicLoading(false);
      history.push("/chats");
    } catch (error) {
      toast({
        title: "Error Occured!",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to Register. Server may be down.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
    }
  };

  const postDetails = (pics) => {
    setPicLoading(true);
    if (pics === undefined) {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
      return;
    }
    if (pics.type === "image/jpeg" || pics.type === "image/png" || pics.type === "image/webp") {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "chat-app");
      data.append("cloud_name", "piyushproj");
      fetch("https://api.cloudinary.com/v1_1/piyushproj/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          setPic(data.url.toString());
          setPicLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setPicLoading(false);
        });
    } else {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
      return;
    }
  };

  return (
    <VStack spacing="12px">
      <FormControl id="signup-name" isRequired>
        <FormLabel
          color={isDark ? "#E9EDEF" : "#111B21"}
          fontWeight="600"
          fontSize="sm"
          mb="5px"
        >
          Name
        </FormLabel>
        <Input
          placeholder="Enter Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          height="40px"
          fontSize="sm"
        />
      </FormControl>

      <FormControl id="signup-email" isRequired>
        <FormLabel
          color={isDark ? "#E9EDEF" : "#111B21"}
          fontWeight="600"
          fontSize="sm"
          mb="5px"
        >
          Email Address
        </FormLabel>
        <Input
          type="email"
          placeholder="Enter Your Email Address"
          value={email}
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
          height="40px"
          fontSize="sm"
        />
      </FormControl>

      <FormControl id="signup-password" isRequired>
        <FormLabel
          color={isDark ? "#E9EDEF" : "#111B21"}
          fontWeight="600"
          fontSize="sm"
          mb="5px"
        >
          Password
        </FormLabel>
        <InputGroup size="md">
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            height="40px"
            fontSize="sm"
          />
          <InputRightElement width="4.5rem" height="40px">
            <Button
              h="1.75rem"
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

      <FormControl id="signup-confirm-password" isRequired>
        <FormLabel
          color={isDark ? "#E9EDEF" : "#111B21"}
          fontWeight="600"
          fontSize="sm"
          mb="5px"
        >
          Confirm Password
        </FormLabel>
        <InputGroup size="md">
          <Input
            type={show ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmpassword}
            onChange={(e) => setConfirmpassword(e.target.value)}
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
            height="40px"
            fontSize="sm"
          />
          <InputRightElement width="4.5rem" height="40px">
            <Button
              h="1.75rem"
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

      <FormControl id="signup-pic">
        <FormLabel
          color={isDark ? "#E9EDEF" : "#111B21"}
          fontWeight="600"
          fontSize="sm"
          mb="5px"
        >
          Upload your Picture
        </FormLabel>
        <Input
          type="file"
          p={1.5}
          accept="image/*"
          onChange={(e) => postDetails(e.target.files[0])}
          bg={isDark ? "#2A3942" : "#F8FAFC"}
          color={isDark ? "#E9EDEF" : "#334155"}
          borderColor={isDark ? "#3E4F5B" : "#CBD5E1"}
          borderRadius="md"
          height="40px"
          fontSize="sm"
        />
      </FormControl>

      <Button
        bg="#00A884"
        color="white"
        _hover={{ bg: "#008f6f" }}
        width="100%"
        height="44px"
        style={{ marginTop: 10 }}
        onClick={submitHandler}
        isLoading={picLoading}
        fontWeight="bold"
        fontSize="md"
        borderRadius="md"
        boxShadow="0 4px 12px rgba(0, 168, 132, 0.3)"
      >
        Sign Up
      </Button>
    </VStack>
  );
};

export default Signup;
