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
  Box,
  Text,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { ChatState } from "../../Context/ChatProvider";

const WALLPAPERS = [
  { id: "doodle", name: "WhatsApp Doodle", color: "#00A884", preview: "#0B141A" },
  { id: "emerald", name: "Deep Emerald", color: "#00A884", preview: "#062b22" },
  { id: "midnight", name: "Midnight Obsidian", color: "#6366F1", preview: "#050B14" },
  { id: "sky", name: "Sky Slate", color: "#0EA5E9", preview: "#0C1F33" },
  { id: "warm", name: "Warm Sunset", color: "#F59E0B", preview: "#261E1B" },
  { id: "minimal", name: "Clean Minimal", color: "#8696A0", preview: "#182229" },
];

const ThemeModal = ({ isOpen, onClose }) => {
  const { themeMode, changeThemeMode, wallpaper, changeWallpaper } = ChatState();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent
        borderRadius="16px"
        bg={isDark ? "#202C33" : "#FFFFFF"}
        color={isDark ? "#E9EDEF" : "#111B21"}
        boxShadow={isDark ? "0 8px 32px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.12)"}
      >
        <ModalHeader fontSize="20px" fontWeight="bold" pb={2}>
          Theme & Background
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {/* Theme Mode Section */}
          <Text fontWeight="semibold" fontSize="sm" mb={3} color="#00A884">
            APP THEME
          </Text>
          <RadioGroup onChange={changeThemeMode} value={themeMode} mb={6}>
            <Stack spacing={3}>
              <Radio value="light" colorScheme="whatsapp">
                ☀️ Light Mode
              </Radio>
              <Radio value="dark" colorScheme="whatsapp">
                🌙 Dark Mode
              </Radio>
              <Radio value="system" colorScheme="whatsapp">
                💻 System Default (Auto)
              </Radio>
            </Stack>
          </RadioGroup>

          {/* Chat Wallpaper Section */}
          <Text fontWeight="semibold" fontSize="sm" mb={3} color="#00A884">
            CHAT WALLPAPER
          </Text>
          <SimpleGrid columns={2} spacing={3}>
            {WALLPAPERS.map((wp) => {
              const isSelected = (wallpaper || "doodle") === wp.id;
              return (
                <Box
                  key={wp.id}
                  onClick={() => changeWallpaper && changeWallpaper(wp.id)}
                  cursor="pointer"
                  p={3}
                  borderRadius="lg"
                  borderWidth="2px"
                  borderColor={isSelected ? "#00A884" : isDark ? "#2A3942" : "#E2E8F0"}
                  bg={isDark ? "#111B21" : "#F8FAFC"}
                  _hover={{
                    borderColor: "#00A884",
                    transform: "translateY(-1px)",
                  }}
                  transition="all 0.15s ease"
                >
                  <Flex alignItems="center" justifyContent="space-between">
                    <Flex alignItems="center" gap={2}>
                      <Box
                        w="20px"
                        h="20px"
                        borderRadius="full"
                        bg={wp.preview}
                        border="2px solid #00A884"
                      />
                      <Text fontSize="xs" fontWeight={isSelected ? "bold" : "medium"}>
                        {wp.name}
                      </Text>
                    </Flex>
                    {isSelected && <CheckIcon boxSize={3} color="#00A884" />}
                  </Flex>
                </Box>
              );
            })}
          </SimpleGrid>
        </ModalBody>
        <ModalFooter>
          <Button
            bg="#00A884"
            _hover={{ bg: "#008F6F" }}
            color="white"
            onClick={onClose}
            borderRadius="md"
            px={6}
          >
            Apply & Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ThemeModal;
