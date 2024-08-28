-- @param {String} $1:testId
-- @param {Int} $2:type

SELECT
	COUNT(*) AS eventCount,
	TYPE,
	createdAt,
	selectedVariant
FROM
	`Event`
WHERE
	testId = ?
	AND TYPE = ?
	AND DATE(createdAt) = DATE(NOW())
GROUP BY
	HOUR(createdAt),
	selectedVariant