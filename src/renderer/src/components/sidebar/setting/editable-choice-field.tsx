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
}: EditableChoiceFieldProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const normalized = value.trim().toLocaleLowerCase();
  const visibleChoices = useMemo(() => {
    if (!filtering || !normalized) return choices;
    return choices.filter((choice) => {
      const searchable = `${choice.label} ${choice.value} ${choice.meta || ""}`;
      return searchable.toLocaleLowerCase().includes(normalized);
    });
  }, [choices, filtering, normalized]);

  const selectChoice = (choice: EditableChoice): void => {
    onInput(choice.value);
    onSelect?.(choice);
    setFiltering(false);
    setOpen(false);
  };

  return (
    <Field
      width="full"
      label={(
        <Flex align="baseline" justify="space-between" width="full" gap="3">
          <Text color="whiteAlpha.800" fontSize="sm" fontWeight="medium">
            {label}
          </Text>
          {help && (
            <Text color="whiteAlpha.500" fontSize="2xs" truncate>
              {help}
            </Text>
          )}
        </Flex>
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
              placeholder={placeholder}
              disabled={disabled}
              bg="whiteAlpha.100"
              borderColor={open ? "blue.400" : "whiteAlpha.200"}
              _hover={{ borderColor: "whiteAlpha.300", bg: "whiteAlpha.100" }}
              _focusVisible={{
                borderColor: "blue.400",
                boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)",
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
              bg="#181b1f"
              borderColor="whiteAlpha.200"
              borderRadius="6px"
              boxShadow="0 16px 36px rgba(0, 0, 0, 0.45)"
              maxH="260px"
              overflowY="auto"
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
                        color={selected ? "blue.100" : "whiteAlpha.800"}
                        bg={selected ? "blue.900" : "transparent"}
                        _hover={{ bg: selected ? "blue.800" : "whiteAlpha.100" }}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectChoice(choice)}
                      >
                        <Flex align="center" width="full" minW="0" gap="2">
                          <Box flex="1" minW="0">
                            <Text fontSize="sm" truncate>
                              {choice.label}
                            </Text>
                            {choice.meta && (
                              <Text color="whiteAlpha.500" fontSize="2xs" truncate>
                                {choice.meta}
                              </Text>
                            )}
                          </Box>
                          {selected && <HiCheck />}
                        </Flex>
                      </Button>
                    );
                  })}
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
    </Field>
  );
}
