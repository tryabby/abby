import { Editor } from '@monaco-editor/react';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function JSONEditor({ onChange, value }: Props) {
  return (
    <Editor
      defaultLanguage='json'
      theme='vs-dark'
      value={value}
      onChange={(e) => onChange(e ?? '')}
      className='min-h-[300px]'
      options={{ padding: { top: 20 } }}
    />
  );
}
