import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  RadioGroup,
  Radio,
  Stack,
  useColorMode,
} from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";

const ThemeModal = ({ isOpen, onClose }) => {
  const { themeMode, changeThemeMode } = ChatState();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent
        borderRadius="16px"
        bg={isDark ? "#202C33" : "#FFFFFF"}
        color={isDark ? "#E9EDEF" : "#111B21"}
      >
        <ModalHeader fontSize="20px" fontWeight="bold">
          Choose Theme
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <RadioGroup onChange={changeThemeMode} value={themeMode}>
            <Stack spacing={4}>
              <Radio value="light" colorScheme="whatsapp">
                ☀️ Light
              </Radio>
              <Radio value="dark" colorScheme="whatsapp">
                🌙 Dark
              </Radio>
              <Radio value="system" colorScheme="whatsapp">
                💻 System default
              </Radio>
            </Stack>
          </RadioGroup>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="whatsapp"
            bg="#00A884"
            _hover={{ bg: "#008F6F" }}
            color="white"
            onClick={onClose}
          >
            OK
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ThemeModal;
