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
	AND(DATE(createdAt) BETWEEN DATE((
			SELECT
				MIN(createdAt)
				FROM `Event`
			WHERE
				testId = ?
				AND TYPE = ?))
		AND DATE(NOW()))
GROUP BY
	DATE(createdAt), selectedVariant