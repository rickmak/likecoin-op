package time

import "time"

type timeLayout string

var (
	DateTimeLayout        timeLayout = "2006-01-02"                   // "YYYY-MM-DD". e.g. "2025-05-05"
	DateTimeTimeLayout    timeLayout = "2006-01-02T15:04:05.000-0700" // "YYYY-MM-DDTHH:MM:SSZ". e.g. "2025-02-01T00:00:00.000+0800"
	DateTimeUTCTimeLayout timeLayout = "2006-01-02T15:04:05.000Z"     // "YYYY-MM-DDTHH:MM:SSZ". e.g. "2025-02-01T00:00:00.000Z"
)

type timeLayouts []timeLayout

func (ls *timeLayouts) Parse(value string) (dt time.Time, err error) {
	for _, layout := range *ls {
		dt, err = time.Parse(string(layout), value)
		if err == nil {
			return dt, err
		}
	}
	return dt, err
}

var TimeLayouts = timeLayouts{
	DateTimeUTCTimeLayout,
	DateTimeTimeLayout,
	DateTimeLayout,
}
