
import { AskOptions } from "./AskOptions"


/*
{{- if or .System .Tools }}

    <|start_header_id|>system<|end_header_id|>

    {{- if .System }}
        {{ .System }}
    {{- end }}

    {{- if .Tools }}

        Cutting Knowledge Date: December 2023
        When you receive a tool call response, use the output to format an answer to the orginal user question.

        You are a helpful assistant with tool calling capabilities.

    {{- end }}

    <|eot_id|>

{{- end }}

{{- range $i, $_ := .Messages }}

  {{- $last := eq (len (slice $.Messages $i)) 1 }}

  {{- if eq .Role "user" }}

    <|start_header_id|>user<|end_header_id|>

    {{- if and $.Tools $last }}

      Given the following functions, please respond with a JSON for a function call with its proper arguments that best answers the given prompt.
      Respond in the format {"name": function name, "parameters": dictionary of argument name and its value}. Do not use variables.

      {{ range $.Tools }}
        {{- . }}
      {{ end }}

      Question: {{ .Content }}

      <|eot_id|>

    {{- else }}

      {{ .Content }}<|eot_id|>

    {{- end }}

    {{ if $last }}
      <|start_header_id|>assistant<|end_header_id|>
    {{ end }}

  {{- else if eq .Role "assistant" }}

    <|start_header_id|>assistant<|end_header_id|>

    {{- if .ToolCalls }}
      {{ range .ToolCalls }}
        {"name": "{{ .Function.Name }}", "parameters": {{ .Function.Arguments }}}
      {{ end }}
    {{- else }}
      {{ .Content }}
    {{- end }}
    {{ if not $last }}
      <|eot_id|>
    {{ end }}

  {{- else if eq .Role "tool" }}
    <|start_header_id|>ipython<|end_header_id|>

    {{ .Content }}
    <|eot_id|>
    {{ if $last }}
      <|start_header_id|>assistant<|end_header_id|>
    {{ end }}

  {{- end }}

{{- end }}
*/

export const _llamaSyntax = ({
  prompt,
  question,
  context,
  tools,
}: AskOptions): string => {

  let completePrompt = "";

  const hasTools = (tools && tools.length > 0);

  completePrompt += `<|begin_of_text|>\n`;
  completePrompt += `<|start_header_id|>system<|end_header_id|>\n`;
  // completePrompt += `Cutting Knowledge Date: December 2023\n`;
  // completePrompt += `Today Date: 23 July 2024\n`;

  completePrompt += `${prompt}\n`;

  if (hasTools) {
    completePrompt += `Cutting Knowledge Date: December 2023`;
    completePrompt += `When you receive a tool call response, use the output to format an answer to the orginal user question.`;

    completePrompt += `You are a helpful assistant with tool calling capabilities.`;
  }

  completePrompt += `<|eot_id|>\n`;

  completePrompt += `<|start_header_id|>user<|end_header_id|>\n`;

  if (context) {
    completePrompt += `Context: ${context}\n`;
  }

  if (hasTools) {
    completePrompt += `Given the following functions, please respond with a JSON for a function call with its proper arguments that best answers the given prompt.\n`;
    completePrompt += `Respond in the format {"name": function name, "arguments": dictionary of argument name and its value}. Do not use variables.\n`;
    completePrompt += JSON.stringify(tools);
  }

  completePrompt += `Question: ${question}\n`;

  completePrompt += `<|eot_id|>\n`;
  completePrompt += `<|start_header_id|>assistant<|end_header_id|>\n`;

  return completePrompt;
};
