import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI from "openai"

import {
	deepInfraDefaultModelId,
	deepInfraDefaultModelInfo,
} from "@roo-code/types"

import type { ApiHandlerOptions, ModelRecord } from "../../shared/api"

import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStreamChunk } from "../transform/stream"
import { getModelParams } from "../transform/model-params"

import { getModels } from "./fetchers/modelCache"

import { DEFAULT_HEADERS } from "./constants"
import { BaseProvider } from "./base-provider"
import type {
	ApiHandlerCreateMessageMetadata,
	SingleCompletionHandler,
} from "../index"

interface CompletionUsage {
	completion_tokens?: number
	prompt_tokens?: number
	total_tokens?: number
}

export class DeepInfraHandler extends BaseProvider implements SingleCompletionHandler {
	protected options: ApiHandlerOptions
	private client: OpenAI
	protected models: ModelRecord = {}

	constructor(options: ApiHandlerOptions) {
		super()
		this.options = options

		const baseURL = this.options.deepInfraBaseUrl || "https://api.deepinfra.com/v1/openai"
		const apiKey = this.options.deepInfraApiKey ?? "not-provided"

		this.client = new OpenAI({ baseURL, apiKey, defaultHeaders: DEFAULT_HEADERS })
	}

	customRequestOptions(_metadata?: ApiHandlerCreateMessageMetadata): OpenAI.RequestOptions | undefined {
		return undefined
	}

	override async *createMessage(
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
		metadata?: ApiHandlerCreateMessageMetadata,
	): AsyncGenerator<ApiStreamChunk> {
		const model = await this.fetchModel()

		let { id: modelId, maxTokens, temperature } = model

		const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			...convertToOpenAiMessages(messages),
		]

		const completionParams: OpenAI.Chat.ChatCompletionCreateParams = {
			model: modelId,
			...(maxTokens && maxTokens > 0 && { max_tokens: maxTokens }),
			temperature,
			messages: openAiMessages,
			stream: true,
			stream_options: { include_usage: true },
		}

		const stream = await this.client.chat.completions.create(
			completionParams,
			this.customRequestOptions(metadata),
		)

		let lastUsage: CompletionUsage | undefined = undefined

		try {
			for await (const chunk of stream) {
				const delta = chunk.choices[0]?.delta

				if (delta?.content) {
					yield { type: "text", text: delta.content }
				}

				if (chunk.usage) {
					lastUsage = chunk.usage
				}
			}
		} catch (error) {
			throw new Error(`DeepInfra API Error: ${error}`)
		}

		if (lastUsage) {
			yield {
				type: "usage",
				inputTokens: lastUsage.prompt_tokens || 0,
				outputTokens: lastUsage.completion_tokens || 0,
				totalCost: 0,
			}
		}
	}

	public async fetchModel() {
		const models = await getModels({ provider: "deepinfra" })
		this.models = models
		return this.getModel()
	}

	override getModel() {
		const id = this.options.deepInfraModelId ?? deepInfraDefaultModelId
		const info = this.models[id] ?? deepInfraDefaultModelInfo

		const params = getModelParams({
			format: "openai",
			modelId: id,
			model: info,
			settings: this.options,
			defaultTemperature: 0,
		})

		return { id, info, ...params }
	}

	async completePrompt(prompt: string) {
		const { id: modelId, maxTokens, temperature } = await this.fetchModel()

		const completionParams: OpenAI.Chat.ChatCompletionCreateParams = {
			model: modelId,
			max_tokens: maxTokens,
			temperature,
			messages: [{ role: "user", content: prompt }],
			stream: false,
		}

		const response = await this.client.chat.completions.create(completionParams)
		const completion = response as OpenAI.Chat.ChatCompletion
		return completion.choices[0]?.message?.content || ""
	}
}
