import { ViewIcon, EditIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  IconButton,
  Text,
  Image,
  useToast,
  VStack,
  HStack,
  Input,
  Box,
  useColorMode,
} from "@chakra-ui/react";
import { useState } from "react";
import axios from "axios";
import { ChatState } from "../../Context/ChatProvider";
import ThemeModal from "./ThemeModal";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isThemeOpen,
    onOpen: onThemeOpen,
    onClose: onThemeClose,
  } = useDisclosure();

  const { user: loggedInUser, setUser, themeMode } = ChatState();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const toast = useToast();

  const [uploading, setUploading] = useState(false);
  const [currentPic, setCurrentPic] = useState(user?.pic);

  // About state
  const defaultAbout = "Hey there! I am using Talk-a-tive";
  const [aboutText, setAboutText] = useState(
    user?.about || loggedInUser?.about || defaultAbout
  );
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [editedAbout, setEditedAbout] = useState(
    user?.about || loggedInUser?.about || defaultAbout
  );
  const [aboutLoading, setAboutLoading] = useState(false);

  const isOwnProfile =
    loggedInUser &&
    (loggedInUser._id === user?._id || loggedInUser.email === user?.email);

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (
      file.type !== "image/jpeg" &&
      file.type !== "image/png" &&
      file.type !== "image/webp"
    ) {
      toast({
        title: "Please select an image file (JPG, PNG, WEBP)",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "chat-app");
      data.append("cloud_name", "piyushproj");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/piyushproj/image/upload",
        {
          method: "POST",
          body: data,
        }
      );
      const cloudData = await res.json();
      const newPicUrl = cloudData.secure_url || cloudData.url;

      if (!newPicUrl) {
        throw new Error("Failed to upload image to cloud storage");
      }

      // Update backend user profile
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${loggedInUser.token}`,
        },
      };

      const { data: updatedUserData } = await axios.put(
        "/api/user/profile",
        { pic: newPicUrl },
        config
      );

      setCurrentPic(newPicUrl);
      setUser(updatedUserData);
      localStorage.setItem("userInfo", JSON.stringify(updatedUserData));

      toast({
        title: "Profile Picture Updated!",
        status: "success",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      setUploading(false);
    } catch (err) {
      toast({
        title: "Error Occured!",
        description:
          err.response?.data?.message ||
          err.message ||
          "Failed to update picture",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setUploading(false);
    }
  };

  const handleSaveAbout = async () => {
    if (!editedAbout.trim()) {
      toast({
        title: "About cannot be empty",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setAboutLoading(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${loggedInUser.token}`,
        },
      };

      const { data: updatedUserData } = await axios.put(
        "/api/user/profile",
        { about: editedAbout.trim() },
        config
      );

      setAboutText(updatedUserData.about);
      setUser(updatedUserData);
      localStorage.setItem("userInfo", JSON.stringify(updatedUserData));
      setIsEditingAbout(false);
      setAboutLoading(false);

      toast({
        title: "About Updated!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    } catch (err) {
      toast({
        title: "Error Occured!",
        description:
          err.response?.data?.message || err.message || "Failed to update About",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      setAboutLoading(false);
    }
  };

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton d={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen} />
      )}
      <Modal size="lg" onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent
          minH="480px"
          borderRadius="18px"
          bg={isDark ? "#202C33" : "#FFFFFF"}
          color={isDark ? "#E9EDEF" : "#111B21"}
        >
          <ModalHeader
            fontSize="32px"
            fontFamily="Work sans"
            d="flex"
            justifyContent="center"
          >
            {user?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            d="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="space-around"
            pb={4}
          >
            <VStack spacing={3}>
              <Image
                borderRadius="full"
                boxSize="140px"
                src={
                  isOwnProfile
                    ? loggedInUser?.pic || currentPic
                    : user?.pic || currentPic
                }
                alt={user?.name}
                objectFit="cover"
                border="3px solid #00A884"
              />

              {isOwnProfile && (
                <>
                  <input
                    type="file"
                    id="profile-pic-input"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePicChange}
                  />
                  <Button
                    as="label"
                    htmlFor="profile-pic-input"
                    cursor="pointer"
                    size="sm"
                    colorScheme="whatsapp"
                    bg="#00A884"
                    _hover={{ bg: "#008F6F" }}
                    color="white"
                    isLoading={uploading}
                  >
                    Change Profile Picture 📷
                  </Button>
                </>
              )}
            </VStack>

            {/* Email info */}
            <Text
              fontSize={{ base: "17px", md: "19px" }}
              fontFamily="Work sans"
              mt={3}
              color={isDark ? "#A0AEC0" : "gray.600"}
            >
              Email: <b>{user?.email}</b>
            </Text>

            {/* About / Bio Section */}
            <Box
              w="100%"
              maxW="400px"
              mt={3}
              p={3}
              borderRadius="12px"
              bg={isDark ? "#111B21" : "#F8F9FA"}
              border={isDark ? "1px solid #2A3942" : "1px solid #E2E8F0"}
            >
              <Text
                fontSize="12px"
                fontWeight="bold"
                color="#00A884"
                textTransform="uppercase"
                mb={1}
              >
                About
              </Text>

              {isOwnProfile && isEditingAbout ? (
                <HStack mt={1} spacing={2}>
                  <Input
                    size="sm"
                    value={editedAbout}
                    onChange={(e) => setEditedAbout(e.target.value)}
                    focusBorderColor="#00A884"
                    borderRadius="8px"
                    bg={isDark ? "#202C33" : "#FFFFFF"}
                  />
                  <IconButton
                    size="sm"
                    colorScheme="whatsapp"
                    bg="#00A884"
                    _hover={{ bg: "#008F6F" }}
                    color="white"
                    icon={<CheckIcon />}
                    isLoading={aboutLoading}
                    onClick={handleSaveAbout}
                    aria-label="Save about"
                  />
                  <IconButton
                    size="sm"
                    variant="ghost"
                    icon={<CloseIcon boxSize={2.5} />}
                    onClick={() => {
                      setIsEditingAbout(false);
                      setEditedAbout(aboutText);
                    }}
                    aria-label="Cancel editing"
                  />
                </HStack>
              ) : (
                <HStack justify="space-between" align="center">
                  <Text
                    fontSize="15px"
                    color={isDark ? "#E9EDEF" : "#2D3748"}
                    fontStyle="italic"
                  >
                    "{isOwnProfile ? (loggedInUser?.about || aboutText) : (user?.about || defaultAbout)}"
                  </Text>
                  {isOwnProfile && (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      color="#00A884"
                      icon={<EditIcon />}
                      onClick={() => setIsEditingAbout(true)}
                      aria-label="Edit about"
                    />
                  )}
                </HStack>
              )}
            </Box>

            {/* Theme Switcher Quick Access (for own profile) */}
            {isOwnProfile && (
              <Box
                w="100%"
                maxW="400px"
                mt={3}
                p={3}
                borderRadius="12px"
                bg={isDark ? "#111B21" : "#F8F9FA"}
                border={isDark ? "1px solid #2A3942" : "1px solid #E2E8F0"}
                d="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Text
                    fontSize="12px"
                    fontWeight="bold"
                    color="#00A884"
                    textTransform="uppercase"
                  >
                    Theme
                  </Text>
                  <Text fontSize="14px" fontWeight="500">
                    {themeMode === "dark"
                      ? "🌙 Dark"
                      : themeMode === "light"
                      ? "☀️ Light"
                      : "💻 System default"}
                  </Text>
                </Box>
                <Button size="sm" variant="outline" colorScheme="teal" onClick={onThemeOpen}>
                  Change Theme
                </Button>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Theme Modal */}
      <ThemeModal isOpen={isThemeOpen} onClose={onThemeClose} />
    </>
  );
};

export default ProfileModal;
