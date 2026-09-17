export type TokenResult = {
  surface: string;
  baseForm: string;
  reading?: string;
  partOfSpeech: string;
  position: number;
};

export interface Tokenizer {
    readonly language: string;

    tokenize(text: string): Promise<TokenResult[]>;
}