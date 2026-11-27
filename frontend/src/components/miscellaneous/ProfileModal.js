import { ViewIcon } from "@chakra-ui/icons";
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
} from "@chakra-ui/react";
import { useState } from "react";
import axios from "axios";
import { ChatState } from "../../Context/ChatProvider";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user: loggedInUser, setUser } = ChatState();
  const toast = useToast();

  const [uploading, setUploading] = useState(false);
  const [currentPic, setCurrentPic] = useState(user?.pic);

  const isOwnProfile =
    loggedInUser &&
    (loggedInUser._id === user?._id || loggedInUser.email === user?.email);

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/webp") {
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
        description: err.response?.data?.message || err.message || "Failed to update picture",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setUploading(false);
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
        <ModalContent minH="440px">
          <ModalHeader
            fontSize="36px"
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
                boxSize="150px"
                src={isOwnProfile ? (loggedInUser?.pic || currentPic) : (user?.pic || currentPic)}
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

            <Text
              fontSize={{ base: "20px", md: "24px" }}
              fontFamily="Work sans"
              mt={4}
              color="gray.700"
            >
              Email: {user?.email}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
