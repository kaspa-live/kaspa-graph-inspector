package processing_errors

import "github.com/pkg/errors"

var ErrMissingParents = errors.New("One or more block parents are missing")
