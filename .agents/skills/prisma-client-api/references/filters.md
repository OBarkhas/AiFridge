# Filter Conditions and Operators

Filter operators for the `where` clause.

## Equality

```typescript
where: {
  email: "alice@prisma.io";
}

where: {
  email: {
    equals: "alice@prisma.io";
  }
}

where: {
  email: {
    not: "alice@prisma.io";
  }
}
```

## Comparison

```typescript

where: { age: { gt: 18 } }


where: { age: { gte: 18 } }


where: { age: { lt: 65 } }


where: { age: { lte: 65 } }


where: { age: { gte: 18, lte: 65 } }
```

## Lists

```typescript

where: { role: { in: ['ADMIN', 'MODERATOR'] } }


where: { role: { notIn: ['GUEST', 'BANNED'] } }
```

## String Filters

```typescript

where: { email: { contains: 'prisma' } }


where: { email: { startsWith: 'alice' } }


where: { email: { endsWith: '@prisma.io' } }


where: {
  email: {
    contains: 'PRISMA',
    mode: 'insensitive'
  }
}
```

## Null Checks

```typescript
where: {
  deletedAt: null;
}

where: {
  deletedAt: {
    not: null;
  }
}

where: {
  middleName: {
    isSet: true;
  }
}
```

## Logical Operators

### AND (implicit)

```typescript

where: {
  email: { contains: '@prisma.io' },
  role: 'ADMIN'
}
```

### AND (explicit)

```typescript
where: {
  AND: [{ email: { contains: "@prisma.io" } }, { role: "ADMIN" }];
}
```

### OR

```typescript
where: {
  OR: [
    { email: { contains: "@gmail.com" } },
    { email: { contains: "@prisma.io" } },
  ];
}
```

### NOT

```typescript
where: {
  NOT: {
    role: "GUEST";
  }
}

where: {
  NOT: [{ role: "GUEST" }, { verified: false }];
}
```

### Combined

```typescript
where: {
  AND: [
    { verified: true },
    {
      OR: [
        { role: 'ADMIN' },
        { role: 'MODERATOR' }
      ]
    }
  ],
  NOT: { deletedAt: { not: null } }
}
```

## Relation Filters

### some

At least one related record matches:

```typescript
where: {
  posts: {
    some: {
      published: true;
    }
  }
}
```

### every

All related records match:

```typescript
where: {
  posts: {
    every: {
      published: true;
    }
  }
}
```

### none

No related records match:

```typescript
where: {
  posts: {
    none: {
      published: true;
    }
  }
}
```

### is / isNot (1-to-1)

```typescript
where: {
  profile: {
    is: {
      country: "USA";
    }
  }
}

where: {
  profile: {
    isNot: null;
  }
}
```

## Array Field Filters

For fields like `String[]`:

```typescript
where: {
  tags: {
    has: "typescript";
  }
}

where: {
  tags: {
    hasSome: ["typescript", "javascript"];
  }
}

where: {
  tags: {
    hasEvery: ["typescript", "prisma"];
  }
}

where: {
  tags: {
    isEmpty: true;
  }
}
```

## JSON Filters

```typescript

where: {
  metadata: {
    path: ['settings', 'theme'],
    equals: 'dark'
  }
}


where: {
  metadata: {
    path: ['bio'],
    string_contains: 'developer'
  }
}
```

## Full-Text Search

```typescript
where: {
  content: {
    search: "prisma database";
  }
}
```
