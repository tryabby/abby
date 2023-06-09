type Modifier = "command" | "ctrl" | "alt" | "shift" | "option" | "meta";
type Char =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";
type SpecialKey =
  | "."
  | ","
  | "/"
  | ";"
  | "'"
  | "["
  | "]"
  | "-"
  | "="
  | "enter"
  | "space"
  | "tab"
  | "backspace"
  | "delete"
  | "escape"
  | "up"
  | "down"
  | "left"
  | "right"
  | "pageup"
  | "pagedown"
  | "home"
  | "end";

type Key = Char | SpecialKey;

export type Shortcut =
  | `${Modifier}+${Key}`
  | Key
  | `${Key} ${Key}`
  | (string & []);
