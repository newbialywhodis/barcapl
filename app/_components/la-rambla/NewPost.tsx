'use client';

import { Paper, Group, Avatar, Textarea, Button, Stack } from '@mantine/core';

interface NewPostProps {
  content: string;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
  session: any;
}

export default function NewPost({ content, onContentChange, onSubmit, session }: NewPostProps) {
  return (
    <Paper p="md" withBorder>
      <Group align="flex-start">
        <Avatar size="md" radius="xl" />
        <Stack style={{ flex: 1 }} gap="xs">
          <Textarea
            value={content}
            onChange={(e) => onContentChange(e.currentTarget.value)}
            placeholder="Co słychać?"
            autosize
            minRows={2}
          />
          <Button onClick={onSubmit} disabled={!content.trim()}>Opublikuj</Button>
        </Stack>
      </Group>
    </Paper>
  );
}