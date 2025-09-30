package trimmedstring

import "strings"

const cutset = " "

type TrimmedString interface {
	String() string
}

type trimmedString string

func (s trimmedString) String() string {
	return string(s)
}

func FromString(s string) TrimmedString {
	return trimmedString(strings.Trim(s, cutset))
}
