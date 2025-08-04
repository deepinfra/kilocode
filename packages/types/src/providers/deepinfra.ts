import type { ModelInfo } from "../model.js"

export const deepInfraDefaultModelId = "meta-llama/Meta-Llama-3.1-70B-Instruct"

export const deepInfraDefaultModelInfo: ModelInfo = {
	maxTokens: 8192,
	contextWindow: 128_000,
	supportsImages: true,
	supportsComputerUse: false,
	supportsPromptCache: false,
	inputPrice: 0.52,
	outputPrice: 0.75,
	description:
		"Meta Llama 3.1 70B Instruct is a powerful large language model with 70 billion parameters, optimized for instruction following and conversational AI tasks. It offers excellent performance across a wide range of applications including text generation, reasoning, and code assistance.",
}
