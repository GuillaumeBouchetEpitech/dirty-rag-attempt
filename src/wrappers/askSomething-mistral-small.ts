
import { AskOptions } from "./AskOptions"

/*
{{- range $index, $_ := .Messages }}

  {{- if eq .Role "system" }}

    [SYSTEM_PROMPT]
      {{ .Content }}
    [/SYSTEM_PROMPT]

  {{- else if eq .Role "user" }}

    {{- if and (le (len (slice $.Messages $index)) 2) $.Tools }}
      [AVAILABLE_TOOLS]
        {{ $.Tools }}
      [/AVAILABLE_TOOLS]
    {{- end }}

    [INST]
      {{ .Content }}
    [/INST]

  {{- else if eq .Role "assistant" }}

    {{- if .Content }}

      {{ .Content }}
      {{- if not (eq (len (slice $.Messages $index)) 1) }}
        </s>
      {{- end }}

    {{- else if .ToolCalls }}

      [TOOL_CALLS][
      {{- range .ToolCalls }}
        {"name": "{{ .Function.Name }}", "arguments": {{ .Function.Arguments }}}
      {{- end }}
      ]</s>
      {{- end }}

    {{- else if eq .Role "tool" }}

      [TOOL_RESULTS]
      {"content": {{ .Content }}}
      [/TOOL_RESULTS]

  {{- end }}

{{- end }}
*/

export const _mistralSmallSyntax = ({
  prompt,
  question,
  context,
  tools,
}: AskOptions): string => {

  let completePrompt = "";


  completePrompt += "<s>"
  completePrompt += "[SYSTEM_PROMPT]"

  completePrompt += `\n`;
  completePrompt += `[INST]\n`;
  completePrompt += `\n`;
  completePrompt += `${prompt}\n`;
  completePrompt += `\n`;

  if (context) {
    completePrompt += `CONTEXT:\n`;
    completePrompt += `\n`;
    completePrompt += `${context}\n`;
  }

  completePrompt += `\n`;
  completePrompt += "[/SYSTEM_PROMPT]"
  completePrompt += `[INST]\n`;

  if (tools && tools.length > 0) {
    completePrompt += `\n`;
    completePrompt += `[AVAILABLE_TOOLS]\n`;
    completePrompt += `[`;
    for (const currTool of tools) {
      completePrompt += JSON.stringify(currTool);
    }
    completePrompt += `]`;
    completePrompt += `[/AVAILABLE_TOOLS]\n`;
    completePrompt += `\n`;
  }

  completePrompt += `\n`;
  completePrompt += `QUESTION:\n`;
  completePrompt += `\n`;
  completePrompt += `${question}\n`;
  completePrompt += `\n`;
  completePrompt += `[/INST]\n`;
  completePrompt += `\n`;
  completePrompt += "</s>"

  return completePrompt;
};
