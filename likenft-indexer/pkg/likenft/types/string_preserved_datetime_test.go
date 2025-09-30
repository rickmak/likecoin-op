package types

import (
	"encoding/json"
	"testing"
	"time"

	. "github.com/smartystreets/goconvey/convey"
)

func TestStringPreservedDateTime(t *testing.T) {
	Convey("2025-05-05", t, func() {
		var parsed StringPreservedDateTime
		err := json.Unmarshal([]byte(`"2025-05-05"`), &parsed)
		if err != nil {
			t.Fatal(err)
		}
		expected, err := time.Parse("2006-01-02T15:04:05Z", "2025-05-05T00:00:00Z")
		if err != nil {
			t.Fatal(err)
		}
		So(parsed.dt, ShouldEqual, expected)
	})
	Convey("2025-02-01T00:00:00.000+0800", t, func() {
		var parsed StringPreservedDateTime
		err := json.Unmarshal([]byte(`"2025-02-01T00:00:00.000+0800"`), &parsed)
		if err != nil {
			t.Fatal(err)
		}
		expected, err := time.Parse("2006-01-02T15:04:05Z", "2025-01-31T16:00:00Z")
		if err != nil {
			t.Fatal(err)
		}
		So(parsed.dt, ShouldEqual, expected)
	})
	Convey("2025-02-01T00:00:00.000Z", t, func() {
		var parsed StringPreservedDateTime
		err := json.Unmarshal([]byte(`"2025-02-01T00:00:00.000Z"`), &parsed)
		if err != nil {
			t.Fatal(err)
		}
		expected, err := time.Parse("2006-01-02T15:04:05Z", "2025-02-01T00:00:00Z")
		if err != nil {
			t.Fatal(err)
		}
		So(parsed.dt, ShouldEqual, expected)

	})
}
