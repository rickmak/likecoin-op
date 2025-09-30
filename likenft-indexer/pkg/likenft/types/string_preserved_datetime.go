package types

import (
	"bytes"
	"encoding/json"
	"time"

	timeutil "likenft-indexer/pkg/likenft/util/time"
)

type StringPreservedDateTime struct {
	rawMessage *json.RawMessage
	dt         time.Time
}

func (t *StringPreservedDateTime) UnmarshalJSON(data []byte) error {
	if bytes.Equal(data, []byte(`""`)) {
		t.rawMessage = nil
		return nil
	}
	dt, err := timeutil.TimeLayouts.Parse(string(bytes.Trim(data, "\"")))
	if err != nil {
		return err
	}

	rawMessage := json.RawMessage(data)
	t.rawMessage = &rawMessage
	t.dt = dt
	return nil
}

func (t *StringPreservedDateTime) MarshalJSON() ([]byte, error) {
	if t.rawMessage == nil {
		return []byte(`""`), nil
	}
	return []byte(*t.rawMessage), nil
}

func (t *StringPreservedDateTime) GetEpochSeconds() int64 {
	return t.dt.Unix()
}

func (t *StringPreservedDateTime) IsEmpty() bool {
	return t.rawMessage == nil
}

func (t *StringPreservedDateTime) ToRawMessage() *json.RawMessage {
	return t.rawMessage
}
