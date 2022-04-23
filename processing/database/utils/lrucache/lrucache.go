package lrucache

import (
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
)

// LRUCache is a least-recently-used cache for any type
// that's able to be indexed by DomainHash
type LRUCache[T any] struct {
	cache    map[externalapi.DomainHash]*T
	capacity int
}

// New creates a new LRUCache
func New[T any](capacity int, preallocate bool) *LRUCache[T] {
	var cache map[externalapi.DomainHash]*T
	if preallocate {
		cache = make(map[externalapi.DomainHash]*T, capacity+1)
	} else {
		cache = make(map[externalapi.DomainHash]*T)
	}
	return &LRUCache[T]{
		cache:    cache,
		capacity: capacity,
	}
}

// Add adds an entry to the LRUCache
func (c *LRUCache[T]) Add(key *externalapi.DomainHash, value *T) {
	c.cache[*key] = value

	if len(c.cache) > c.capacity {
		c.evictRandom()
	}
}

// Get returns the entry for the given key, or (nil, false) otherwise
func (c *LRUCache[T]) Get(key *externalapi.DomainHash) (*T, bool) {
	value, ok := c.cache[*key]
	if !ok {
		return nil, false
	}
	return value, true
}

// Has returns whether the LRUCache contains the given key
func (c *LRUCache[T]) Has(key *externalapi.DomainHash) bool {
	_, ok := c.cache[*key]
	return ok
}

// Remove removes the entry for the the given key. Does nothing if
// the entry does not exist
func (c *LRUCache[T]) Remove(key *externalapi.DomainHash) {
	delete(c.cache, *key)
}

func (c *LRUCache[T]) evictRandom() {
	var keyToEvict externalapi.DomainHash
	for key := range c.cache {
		keyToEvict = key
		break
	}
	c.Remove(&keyToEvict)
}
