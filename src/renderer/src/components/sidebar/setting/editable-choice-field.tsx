/* eslint-disable import/no-extraneous-dependencies */
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Input,
  Popover,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { HiCheck, HiChevronUpDown } from "react-icons/hi2";
import { Field } from "@/components/ui/field";
import { InputGroup } from "@/components/ui/input-group";

export interface EditableChoice {
  key: string;
  value: string;
  label: string;
  meta?: string;
}

interface EditableChoiceFieldProps {
  label: string;
  value: string;
  onInput: (value: string) => void;
  onSelect?: (choice: EditableChoice) => void;
  choices: EditableChoice[];
  placeholder: string;
  emptyText: string;
  help?: string;
  disabled?: boolean;
  maxVisible?: number;
  overflowText?: string;
}

export function EditableChoiceField({
  label,
  value,
  onInput,
  onSelect,
  choices,
  placeholder,
  emptyText,
  help,
  disabled = false,
  maxVisible,
  overflowText,
}: EditableChoiceFieldProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const normalized = value.trim().toLocaleLowerCase();
  const filteredChoices = useMemo(() => {
    if (!filtering || !normalized) return choices;
    return choices.filter((choice) => {
      const searchable = `${choice.label} ${choice.value} ${choice.meta || ""}`;
      return searchable.toLocaleLowerCase().includes(normalized);
    });
  }, [choices, filtering, normalized]);
  const visibleChoices = maxVisible
    ? filteredChoices.slice(0, maxVisible)
    : filteredChoices;
  const hiddenCount = filteredChoices.length - visibleChoices.length;

  const selectChoice = (choice: EditableChoice): void => {
    onInput(choice.value);
    onSelect?.(choice);
    setFiltering(false);
    setOpen(false);
  };

  return (
    <Field
      width="full"
      minWidth="0"
      label={(
        <Stack width="full" minWidth="0" gap="0.5">
          <Text
            color="#d8dee4"
            fontSize="sm"
            fontWeight="medium"
            lineHeight="1.45"
            overflowWrap="anywhere"
          >
            {label}
          </Text>
          {help && (
            <Text
              color="#7f8a94"
              fontSize="2xs"
              lineHeight="1.45"
              overflowWrap="anywhere"
              width="full"
            >
              {help}
            </Text>
          )}
        </Stack>
      )}
    >
      <Popover.Root
        open={open}
        onOpenChange={(details) => setOpen(details.open)}
        autoFocus={false}
        positioning={{ placement: "bottom-start", sameWidth: true, gutter: 6 }}
      >
        <Popover.Anchor width="full">
          <InputGroup
            width="full"
            endElement={(
              <Button
                aria-label={`${label} options`}
                variant="ghost"
                size="xs"
                minW="7"
                h="7"
                color="whiteAlpha.600"
                onClick={() => {
                  setFiltering(false);
                  setOpen((current) => !current);
                }}
                disabled={disabled}
              >
                <HiChevronUpDown />
              </Button>
            )}
            endElementProps={{ pe: "1" }}
          >
            <Input
              value={value}
              title={value}
              placeholder={placeholder}
              disabled={disabled}
              minHeight="40px"
              bg="#12181d"
              borderColor={open ? "#77a8ff" : "#2b343c"}
              color="#eef2f5"
              _placeholder={{ color: "#69747e" }}
              _hover={{ borderColor: "#3a4651", bg: "#171e24" }}
              _focusVisible={{
                borderColor: "#77a8ff",
                boxShadow: "0 0 0 1px #77a8ff",
              }}
              onFocus={() => {
                setFiltering(false);
                setOpen(true);
              }}
              onChange={(event) => {
                setFiltering(true);
                setOpen(true);
                onInput(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
                if (event.key === "ArrowDown") setOpen(true);
              }}
            />
          </InputGroup>
        </Popover.Anchor>
        <Portal>
          <Popover.Positioner>
            <Popover.Content
              bg="#11171b"
              borderColor="#2c363f"
              borderRadius="7px"
              boxShadow="0 18px 42px rgba(0, 0, 0, 0.52)"
              maxH="min(320px, calc(100vh - 64px))"
              maxW="calc(100vw - 32px)"
              overflowY="auto"
              overflowX="hidden"
              p="1"
              width="var(--reference-width)"
            >
              {visibleChoices.length ? (
                <Stack gap="0.5">
                  {visibleChoices.map((choice) => {
                    const selected = choice.value === value;
                    return (
                      <Button
                        key={choice.key}
                        variant="ghost"
                        justifyContent="flex-start"
                        textAlign="left"
                        minH="10"
                        h="auto"
                        px="3"
                        py="2"
                        borderRadius="4px"
                        color={selected ? "#e6f0ff" : "#d7dde2"}
                        bg={selected ? "#20334a" : "transparent"}
                        _hover={{ bg: selected ? "#29415d" : "#1b2329" }}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectChoice(choice)}
                      >
                        <Flex align="center" width="full" minW="0" gap="2">
                          <Box flex="1" minW="0">
                            <Text
                              fontSize="sm"
                              lineHeight="1.4"
                              whiteSpace="normal"
                              overflowWrap="anywhere"
                            >
                              {choice.label}
                            </Text>
                            {choice.meta && (
                              <Text
                                color="#7f8a94"
                                fontSize="2xs"
                                lineHeight="1.4"
                                whiteSpace="normal"
                                overflowWrap="anywhere"
                              >
                                {choice.meta}
                              </Text>
                            )}
                          </Box>
                          {selected && <Box as={HiCheck} flexShrink="0" />}
                        </Flex>
                      </Button>
                    );
                  })}
                  {hiddenCount > 0 && overflowText && (
                    <Text
                      color="#83909a"
                      fontSize="2xs"
                      lineHeight="1.45"
                      px="3"
                      py="2.5"
                      overflowWrap="anywhere"
                    >
                      {overflowText.replace("{{count}}", String(hiddenCount))}
                    </Text>
                  )}
                </Stack>
              ) : (
                <Text color="whiteAlpha.500" fontSize="xs" px="3" py="3">
                  {emptyText}
                </Text>
              )}
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
      {value.length > 44 && (
        <Text
          color="#7f8a94"
          fontSize="2xs"
          lineHeight="1.45"
          overflowWrap="anywhere"
          width="full"
        >
          {value}
        </Text>
      )}
    </Field>
  );
}
