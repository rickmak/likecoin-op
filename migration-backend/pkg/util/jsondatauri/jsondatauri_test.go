package jsondatauri_test

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"

	"github.com/likecoin/like-migration-backend/pkg/util/jsondatauri"

	. "github.com/smartystreets/goconvey/convey"
	"github.com/stretchr/testify/require"
	goyaml "gopkg.in/yaml.v2"
)

type ClientMock struct {
	expectedResponse string
}

func MakeClientMock(expectedResponse string) *ClientMock {
	return &ClientMock{
		expectedResponse: expectedResponse,
	}
}

func (c *ClientMock) Do(req *http.Request) (*http.Response, error) {
	return &http.Response{
		Body: io.NopCloser(strings.NewReader(c.expectedResponse)),
	}, nil
}

func TestJSONDataUri(t *testing.T) {
	Convey("Tests", t, func() {
		f, err := os.Open("testdata/testdata.yaml")
		if err != nil {
			t.Fatal(err)
		}
		defer f.Close()

		type TestCase struct {
			Name          string `json:"name"`
			DataURIString string `json:"datauristring"`
			HttpResponse  string `json:"httpresponse"`
			Expected      string `json:"expected"`
			Error         string `json:"error"`
		}

		decoder := goyaml.NewDecoder(f)

		for {
			var testCase TestCase
			err := decoder.Decode(&testCase)
			if errors.Is(err, io.EOF) {
				break
			} else if err != nil {
				t.Fatal(err)
			}

			var httpClient *ClientMock = nil
			if testCase.HttpResponse != "" {
				httpClient = MakeClientMock(testCase.HttpResponse)
			}

			Convey(testCase.Name, func() {
				s := jsondatauri.JSONDataUri(testCase.DataURIString)
				out := make(map[string]any)
				err := s.Resolve(httpClient, &out)
				if err != nil {
					So(testCase.Error, ShouldNotEqual, "")
					So(err.Error(), ShouldContainSubstring, testCase.Error)
				} else {
					str, err := json.Marshal(out)
					if err != nil {
						t.Fatal(err)
					}
					So(err, ShouldBeNil)
					require.JSONEq(t, string(str), testCase.Expected)
				}
			})
		}
	})
}
