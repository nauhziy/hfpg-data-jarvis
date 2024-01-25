import { Box, Text, SimpleGrid, VStack } from '@chakra-ui/react'
import { useIsTabletView } from '~/hooks/isTabletView'

export const SuggestionsSection = ({
  suggestions,
  onClickSuggestion,
}: {
  suggestions: string[]
  onClickSuggestion: (message: string) => void
}) => {
  // TODO: Clean up text styles if this becomes a real thing
  const isTabletView = useIsTabletView()

  // this is the default value in the database
  if (suggestions.length === 0) return <></>

  return (
    <VStack align="start" w="full">
      <Text fontSize={isTabletView ? '14px' : undefined}>
        Here are my suggestions:
      </Text>
      <SimpleGrid columns={2} gap={2} w="full">
        {suggestions.map((suggestion) => (
          <Box
            borderRadius={8}
            border="1px"
            key={suggestion}
            borderColor="interaction.main-subtle.default"
            bgColor="white"
            p={4}
            _hover={{
              bgColor: 'interaction.muted.main.hover',
              cursor: 'pointer',
            }}
            _active={{
              bgColor: 'interaction.muted.main.active',
            }}
            onClick={() => onClickSuggestion(suggestion)}
          >
            <Text textStyle="caption-2" textColor="brand.secondary.400">
              {suggestion}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
