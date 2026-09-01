import {
  Box, Button, Flex, Input, Text,
} from '@chakra-ui/react';
import { RuntimeQuestion } from '@/services/websocket-service';

export type PermissionAnswers = Record<string, string[]>;

interface PermissionQuestionFieldsProps {
  input: unknown;
  answers: PermissionAnswers;
  onChange: (answers: PermissionAnswers) => void;
  placeholder: string;
  compact?: boolean;
}

export function permissionQuestions(input: unknown): RuntimeQuestion[] {
  if (!input || typeof input !== 'object') return [];
  const { questions } = input as { questions?: unknown };
  if (!Array.isArray(questions)) return [];
  return questions.filter((question): question is RuntimeQuestion => (
    Boolean(question)
      && typeof question === 'object'
      && typeof (question as RuntimeQuestion).question === 'string'
  ));
}

function questionKey(question: RuntimeQuestion, index: number): string {
  return String(question.id || index);
}

export function permissionAnswerPayload(answers: PermissionAnswers): string {
  return JSON.stringify(answers);
}

export function hasPermissionAnswers(
  questions: RuntimeQuestion[],
  answers: PermissionAnswers,
): boolean {
  return questions.every((question, index) => (
    (answers[questionKey(question, index)] || []).some((answer) => answer.trim())
  ));
}

export function PermissionQuestionFields({
  input,
  answers,
  onChange,
  placeholder,
  compact = false,
}: PermissionQuestionFieldsProps): JSX.Element | null {
  const questions = permissionQuestions(input);
  if (!questions.length) return null;

  return (
    <Box mt={compact ? '2' : '2.5'}>
      {questions.map((question, index) => {
        const key = questionKey(question, index);
        const selected = answers[key] || [];
        const options = question.options || [];
        const optionLabels = new Set(options.map((option) => option.label));
        const customValue = selected.find((value) => !optionLabels.has(value)) || '';
        const multiple = Boolean(question.multiple || question.multiSelect);
        const allowCustom = question.custom !== false;

        return (
          <Box key={key} mb={index === questions.length - 1 ? '0' : '3'}>
            {question.header && (
              <Text color="#e1c27c" fontSize="2xs" fontWeight="semibold" mb="0.5">
                {question.header}
              </Text>
            )}
            <Text color="#eee8d9" fontSize="xs" lineHeight="1.45" overflowWrap="anywhere">
              {question.question}
            </Text>
            {options.length > 0 && (
              <Flex gap="1.5" mt="1.5" wrap="wrap">
                {options.map((option) => {
                  const active = selected.includes(option.label);
                  return (
                    <Button
                      key={option.label}
                      type="button"
                      size="xs"
                      height="auto"
                      minH="7"
                      maxW="100%"
                      px="2.5"
                      py="1.5"
                      whiteSpace="normal"
                      textAlign="left"
                      overflowWrap="anywhere"
                      variant={active ? 'solid' : 'outline'}
                      bg={active ? '#dce9f5' : 'transparent'}
                      color={active ? '#11181d' : '#d9dfe3'}
                      borderColor={active ? '#dce9f5' : '#53616a'}
                      title={option.description}
                      onClick={() => {
                        if (!multiple) {
                          onChange({ ...answers, [key]: [option.label] });
                          return;
                        }
                        onChange({
                          ...answers,
                          [key]: active
                            ? selected.filter((value) => value !== option.label)
                            : [...selected, option.label],
                        });
                      }}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </Flex>
            )}
            {(allowCustom || !options.length) && (
              <Input
                value={customValue}
                onChange={(event) => {
                  const optionValues = selected.filter((value) => optionLabels.has(value));
                  const { value } = event.target;
                  onChange({
                    ...answers,
                    [key]: value ? [...(multiple ? optionValues : []), value] : optionValues,
                  });
                }}
                placeholder={placeholder}
                mt="1.5"
                size="sm"
                bg="rgba(0, 0, 0, 0.24)"
                borderColor="rgba(227, 194, 122, 0.4)"
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
