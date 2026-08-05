"""
Follow-up Question Generation Prompt Template
"""

SUGGESTIONS_PROMPT = """Based on the conversation and the context from the knowledge base, generate exactly 3 to 5 short, relevant follow-up questions that the user might want to ask next.

RULES:
1. Questions must be related to the conversation topic AND the available knowledge base context.
2. Questions should be concise (under 15 words each).
3. Questions should explore different aspects of the topic.
4. Questions should be phrased naturally, as a user would ask them.
5. Return ONLY the questions, one per line, without numbering or bullet points.

Context from knowledge base:
{context}

Current conversation:
Question: {question}
Answer: {answer}

Generate 3-5 follow-up questions:"""
