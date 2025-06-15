
import { AskOptions } from "./AskOptions"

/*
{{- if .Messages }}

  {{- range $index, $_ := .Messages }}

    {{- if eq .Role "user" }}

      {{- if and (eq (len (slice $.Messages $index)) 1) $.Tools }}
        [AVAILABLE_TOOLS]
        {{ $.Tools }}
        [/AVAILABLE_TOOLS]
      {{- end }}

      [INST]

      {{ if and $.System (eq (len (slice $.Messages $index)) 1) }}
        {{ $.System }}
      {{ end }}

      {{ .Content }}

      [/INST]

    {{- else if eq .Role "assistant" }}

      {{- if .Content }}

        {{ .Content }}

      {{- else if .ToolCalls }}

        [TOOL_CALLS]
        [
        {{- range .ToolCalls }}
          {"name": "{{ .Function.Name }}", "arguments": {{ .Function.Arguments }}}
        {{- end }}
        ]

      {{- end }}

      </s>

    {{- else if eq .Role "tool" }}

      [TOOL_RESULTS]
        {"content": {{ .Content }}}
      [/TOOL_RESULTS]
    {{- end }}

  {{- end }}

{{- else }}

  [INST]
  {{ if .System }}
    {{ .System }}
  {{ end }}
  {{ .Prompt }}
  [/INST]

{{- end }}

{{ .Response }}

{{- if .Response }}
  </s>
{{- end }}
*/

export const _mistralSyntax = ({
  prompt,
  question,
  context,
  tools,
}: AskOptions): string => {

  let completePrompt = "";

  if (tools && tools.length > 0) {
    completePrompt += `[AVAILABLE_TOOLS]`;
    completePrompt += JSON.stringify(tools);
    completePrompt += `[/AVAILABLE_TOOLS]`;
  }

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
  completePrompt += `QUESTION:\n`;
  completePrompt += `\n`;
  completePrompt += `${question}\n`;
  completePrompt += `\n`;
  completePrompt += `[/INST]\n`;
  completePrompt += `\n`;
  completePrompt += `</s>`;
  completePrompt += `\n`;

  return completePrompt;
};
