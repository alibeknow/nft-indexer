package average

import (
	"sync"
)

type Incremental struct {
	mu    sync.Mutex
	count int64
	avg   int64
}

func (inc *Incremental) Increment(val int64) {
	inc.mu.Lock()
	defer inc.mu.Unlock()

	inc.count++

	switch {
	case val > inc.avg:
		inc.avg = inc.avg + (val-inc.avg)/inc.count
	case val < inc.avg:
		inc.avg = val + ((inc.avg - val) * (inc.count - 1) / inc.count)
	}
}

func (inc *Incremental) Count() int64 {
	return inc.count
}

func (inc *Incremental) Value() int64 {
	return inc.avg
}
