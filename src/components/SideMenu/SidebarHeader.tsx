import { HStack, Icon, Text } from '@chakra-ui/react'
import { SIDE_MENU_ITEM_PX } from './sidemenu.constants'
import { BsPencilSquare } from 'react-icons/bs'
import { useRouter } from 'next/router'
import { useSetAtom } from 'jotai'
import {
  FAKE_CHAT_ID,
  conversationStoreAtom,
} from '../ChatWindow/chat-window.atoms'

export const SidebarHeader = () => {
  const router = useRouter()
  const setConversationStoreState = useSetAtom(conversationStoreAtom)
  return (
    <HStack
      justify="space-between"
      w="full"
      borderRadius={4}
      py={4}
      mb={4}
      color="white"
      _hover={{ bgColor: 'whiteAlpha.200', cursor: 'pointer' }}
      _active={{ bgColor: 'whiteAlpha.100' }}
      px={SIDE_MENU_ITEM_PX}
      onClick={async () => {
        setConversationStoreState((prev) => ({
          ...prev,
          [FAKE_CHAT_ID]: {
            messages: [],
            isGeneratingResponse: false,
            isInputDisabled: false,
          },
        }))
        await router.push('/chat')
      }}
    >
      <Text textStyle="subhead-2">New Chat</Text>
      <Icon as={BsPencilSquare} />
    </HStack>
  )
}