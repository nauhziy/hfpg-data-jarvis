import { protectedProcedure, router } from '~/server/trpc'
import { z } from 'zod'
import { mapDateToChatHistoryGroup } from './watson.utils'
import _ from 'lodash'
import { prisma } from '~/server/prisma'
import { FAKE_CHAT_ID } from '~/components/ChatWindow/chat-window.atoms'
import { TRPCError } from '@trpc/server'

// TODO: Add RBAC to this whole layer in the future
export const watsonRouter = router({
  getPastConversations: protectedProcedure.query(
    async ({ ctx: { prisma, user } }) => {
      const pastConversations = await prisma.conversation.findMany({
        where: { userId: user.id },
        select: { id: true, title: true, latestChatMessageAt: true },
      })

      const convosWithBuckets = pastConversations.map((convo) => ({
        ...convo,
        lastUpdatedAtBucket: mapDateToChatHistoryGroup(
          convo.latestChatMessageAt,
        ),
        latestChatMessageAt: convo.latestChatMessageAt,
      }))

      return _.groupBy(
        convosWithBuckets,
        ({ lastUpdatedAtBucket }) => lastUpdatedAtBucket,
      )
    },
  ),
  createConversation: protectedProcedure
    .input(z.object({ question: z.string() }))
    .mutation(async ({ ctx: { user }, input: { question } }) => {
      return await prisma.conversation.create({
        data: { userId: user.id, title: question.slice(0, 30) },
        select: { id: true },
      })
    }),
  getChatMessagesForConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(
      async ({
        ctx: {
          prisma,
          user: { id: userId },
        },
        input: { conversationId },
      }) => {
        // Hack for initial convo
        if (conversationId === FAKE_CHAT_ID) return []

        const conversation = await prisma.conversation.findFirstOrThrow({
          where: { id: conversationId, userId },
        })

        const chatMessages = await prisma.chatMessage.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: 'asc' },
          select: {
            rawMessage: true,
            type: true,
            suggestions: true,
            badResponseReason: true,
            isGoodResponse: true,
            id: true,
            createdAt: true,
          },
        })

        return chatMessages
      },
    ),
  updateConversationTitle: protectedProcedure
    .input(z.object({ conversationId: z.number(), title: z.string() }))
    .mutation(
      async ({
        ctx: {
          prisma,
          user: { id: userId },
        },
        input: { conversationId, title },
      }) => {
        await prisma.conversation.update({
          where: { id: conversationId, userId },
          data: { title },
        })
      },
    ),
  // TODO: Add rate limiting in the future
  // TODO: Add RBAC in the future, technically anyone can rate aynones responses atm
  rateResponse: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        isGoodResponse: z.boolean(),
        badResponseReason: z.string().max(300).optional(),
      }),
    )
    .mutation(
      async ({
        ctx: {
          prisma,
          user: { id: requestUserId },
        },
        input: { messageId, isGoodResponse, badResponseReason },
      }) => {
        const { conversationId } = await prisma.chatMessage.findFirstOrThrow({
          where: { id: messageId },
          select: { conversationId: true },
        })

        const { userId } = await prisma.conversation.findFirstOrThrow({
          where: { id: conversationId },
          select: { userId: true },
        })

        if (userId !== requestUserId) {
          throw new TRPCError({ code: 'UNAUTHORIZED' })
        }

        await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            isGoodResponse,
            badResponseReason,
          },
        })
      },
    ),
})
